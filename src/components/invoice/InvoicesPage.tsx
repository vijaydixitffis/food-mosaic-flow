import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, IndianRupee, Calendar, User, Package } from 'lucide-react';
import { Invoice } from './Invoice';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  clients: {
    id: string;
    name: string;
    client_code: string;
    office_address: string;
    company_registration_number: string;
    office_phone_number: string;
    contact_person: string;
    contact_person_phone_number: string;
    gst_number: string;
    is_igst: boolean;
    discount: number;
  };
  order_products: Array<{
    id: string;
    product_id: string;
    pouch_size: number;
    number_of_pouches: number;
    total_weight: number;
    products: {
      id: string;
      name: string;
      sale_price: number | null;
      hsn_code: string;
      gst: number | null;
    };
  }>;
};

export function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const { toast } = useToast();
  const { isStaff } = useAuth();

  // Fetch orders for search
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders-for-invoice'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            id,
            name,
            client_code,
            office_address,
            company_registration_number,
            office_phone_number,
            contact_person,
            contact_person_phone_number,
            gst_number,
            is_igst,
            discount
          ),
          order_products (
            id,
            product_id,
            pouch_size,
            number_of_pouches,
            total_weight,
            products (
              id,
              name,
              sale_price,
              hsn_code,
              gst
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  // Filter orders based on search term
  const filteredOrders = ordersData?.filter(order => 
    order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clients?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clients?.client_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleGenerateInvoice = (order: Order) => {
    if (isStaff) {
      toast({
        title: "Access Restricted",
        description: "You can only view invoices",
        variant: "destructive",
      });
      return;
    }

    // Check if order has products
    if (!order.order_products || order.order_products.length === 0) {
      toast({
        title: "No Products",
        description: "Cannot generate invoice for an order with no products",
        variant: "destructive",
      });
      return;
    }

    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  const handleInvoiceClose = () => {
    setIsInvoiceOpen(false);
    setSelectedOrder(null);
  };

  const calculateOrderTotal = (order: Order) => {
    const subtotal = order.order_products.reduce((total, item) => {
      const price = item.products?.sale_price || 0;
      const quantity = item.number_of_pouches;
      return total + (price * quantity);
    }, 0);
    
    const discount = (subtotal * order.clients.discount) / 100;
    const taxableAmount = subtotal - discount;
    const gst = (taxableAmount * 18) / 100;
    
    return subtotal - discount + gst;
  };

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <IndianRupee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
            <p className="text-slate-600">Generate and manage client invoices</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-white shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-500" />
            Search Orders for Invoice Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order code, client name, or client code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No orders found matching your search.' : 'No orders available for invoice generation.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="outline" className="font-mono text-sm">
                            {order.order_code}
                          </Badge>
                          <Badge 
                            variant={order.status === 'COMPLETE' ? 'default' : 'secondary'}
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{order.clients?.name}</p>
                              <p className="text-gray-500">{order.clients?.client_code}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">Order Date</p>
                              <p className="text-gray-500">{order.order_date}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">Products</p>
                              <p className="text-gray-500">
                                {order.order_products?.length || 0} items
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {order.order_products && order.order_products.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">
                              Total Amount: ₹{calculateOrderTotal(order).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          onClick={() => handleGenerateInvoice(order)}
                          disabled={!order.order_products || order.order_products.length === 0}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      {selectedOrder && (
        <Invoice
          order={selectedOrder}
          isOpen={isInvoiceOpen}
          onClose={handleInvoiceClose}
        />
      )}
    </div>
  );
} 