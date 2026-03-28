import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Download, IndianRupee, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  clients: {
    id: string;
    name: string;
    client_code: string;
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
    } | null;
    product_prices?: {
      id: string;
      product_id: string;
      category_id: string;
      sale_price: number;
    } | null;
  }>;
};

type ClientRevenue = {
  clientId: string;
  clientName: string;
  clientCode: string;
  gstNumber: string;
  invoiceCount: number;
  totalQuantity: number;
  taxableValue: number;
  totalGst: number;
  invoiceValue: number;
};

interface RevenueByClientProps {
  startDate: string;
  endDate: string;
}

export function RevenueByClient({ startDate, endDate }: RevenueByClientProps) {
  // Fetch orders within date range
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['revenue-by-client', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            id,
            name,
            client_code,
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
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .order('order_date', { ascending: true });

      if (error) throw error;

      // Fetch category-specific prices for accurate totals
      const ordersWithPrices = await Promise.all(
        (data || []).map(async (order) => {
          const productIds = order.order_products?.map(op => op.product_id) || [];
          if (productIds.length === 0) return order;

          const { data: prices, error: priceError } = await supabase
            .from('product_prices')
            .select('*')
            .in('product_id', productIds);

          if (priceError) return order;

          const priceMap = new Map<string, any[]>();
          prices?.forEach(price => {
            if (!priceMap.has(price.product_id)) {
              priceMap.set(price.product_id, []);
            }
            priceMap.get(price.product_id)!.push(price);
          });

          const orderProducts = order.order_products?.map(op => {
            const matchingPrice = priceMap.get(op.product_id)?.find(
              price => price.category_id === order.category_id
            );
            return { ...op, product_prices: matchingPrice || null };
          }) || [];

          return { ...order, order_products: orderProducts };
        })
      );

      return ordersWithPrices as Order[];
    },
  });

  // Expose refetch to parent via window object for button click
  React.useEffect(() => {
    (window as any).revenueByClientRefetch = refetch;
    return () => {
      delete (window as any).revenueByClientRefetch;
    };
  }, [refetch]);

  // Helper functions for GST calculations
  const getProductPrice = (orderProduct: Order['order_products'][0]) => {
    if (orderProduct.product_prices) {
      return orderProduct.product_prices.sale_price;
    }
    return orderProduct.products?.sale_price || 0;
  };

  const calcBasePrice = (rate: number, gstPercent: number) => {
    return gstPercent > 0 ? rate / (1 + gstPercent / 100) : rate;
  };

  const calcDiscountedPrice = (basePrice: number, clientDiscount: number) => {
    return basePrice * (1 - clientDiscount / 100);
  };

  const calcTaxableValue = (basePrice: number, clientDiscount: number, qty: number) => {
    const discountedPrice = calcDiscountedPrice(basePrice, clientDiscount);
    return discountedPrice * qty;
  };

  const calcGSTOnTaxableValue = (taxableValue: number, gstPercent: number) => {
    return taxableValue * (gstPercent / 100);
  };

  // Transform orders into client revenue summary
  const clientRevenues: ClientRevenue[] = useMemo(() => {
    if (!ordersData) return [];

    const clientMap = new Map<string, ClientRevenue>();

    ordersData.forEach(order => {
      const clientId = order.clients?.id;
      if (!clientId) return;

      let orderTaxableValue = 0;
      let orderGst = 0;
      let orderQuantity = 0;

      order.order_products.forEach(item => {
        const rate = getProductPrice(item);
        const quantity = item.number_of_pouches;
        const gstRate = item.products?.gst || 0;
        const clientDiscount = order.clients?.discount || 0;

        const basePrice = calcBasePrice(rate, gstRate);
        const taxableValue = calcTaxableValue(basePrice, clientDiscount, quantity);
        const gstAmount = calcGSTOnTaxableValue(taxableValue, gstRate);

        orderTaxableValue += taxableValue;
        orderGst += gstAmount;
        orderQuantity += quantity;
      });

      if (clientMap.has(clientId)) {
        const existing = clientMap.get(clientId)!;
        existing.invoiceCount += 1;
        existing.totalQuantity += orderQuantity;
        existing.taxableValue += orderTaxableValue;
        existing.totalGst += orderGst;
        existing.invoiceValue += orderTaxableValue + orderGst;
      } else {
        clientMap.set(clientId, {
          clientId,
          clientName: order.clients?.name || '',
          clientCode: order.clients?.client_code || '',
          gstNumber: order.clients?.gst_number || '',
          invoiceCount: 1,
          totalQuantity: orderQuantity,
          taxableValue: orderTaxableValue,
          totalGst: orderGst,
          invoiceValue: orderTaxableValue + orderGst,
        });
      }
    });

    // Convert to array and sort by invoice value descending, then invoice count descending
    return Array.from(clientMap.values()).sort((a, b) => {
      if (b.invoiceValue !== a.invoiceValue) {
        return b.invoiceValue - a.invoiceValue; // Primary: Invoice value desc
      }
      return b.invoiceCount - a.invoiceCount; // Secondary: Invoice count desc
    });
  }, [ordersData]);

  // Calculate totals
  const totals = useMemo(() => {
    return clientRevenues.reduce(
      (acc, client) => ({
        invoiceCount: acc.invoiceCount + client.invoiceCount,
        totalQuantity: acc.totalQuantity + client.totalQuantity,
        taxableValue: acc.taxableValue + client.taxableValue,
        totalGst: acc.totalGst + client.totalGst,
        invoiceValue: acc.invoiceValue + client.invoiceValue,
      }),
      { invoiceCount: 0, totalQuantity: 0, taxableValue: 0, totalGst: 0, invoiceValue: 0 }
    );
  }, [clientRevenues]);

  const handleExportCSV = () => {
    const headers = [
      'Client Code',
      'Client Name',
      'GST Number',
      'Invoice Count',
      'Total Quantity',
      'Taxable Value',
      'Total GST',
      'Invoice Value',
    ];

    const rows = clientRevenues.map(client => [
      client.clientCode,
      client.clientName,
      client.gstNumber,
      client.invoiceCount,
      client.totalQuantity,
      client.taxableValue.toFixed(2),
      client.totalGst.toFixed(2),
      client.invoiceValue.toFixed(2),
    ]);

    // Add totals row
    rows.push([
      'TOTAL',
      '',
      '',
      totals.invoiceCount,
      totals.totalQuantity,
      totals.taxableValue.toFixed(2),
      totals.totalGst.toFixed(2),
      totals.invoiceValue.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Revenue_by_Client_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading Revenue by Client...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading Revenue by Client: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Revenue by Client Summary
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total Clients</p>
              <p className="text-lg font-semibold">{clientRevenues.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total Invoices</p>
              <p className="text-lg font-semibold">{totals.invoiceCount}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Taxable Value</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total GST</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total Quantity</p>
              <p className="text-lg font-semibold">{totals.totalQuantity.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="bg-blue-100 rounded-lg px-6 py-3">
              <p className="text-sm text-gray-600">Total Revenue (incl. GST)</p>
              <p className="text-2xl font-bold text-blue-700 flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {totals.invoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            Client-wise Revenue Breakdown
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({startDate} to {endDate})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientRevenues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Client Code</TableHead>
                    <TableHead className="font-semibold">Client Name</TableHead>
                    <TableHead className="font-semibold">GST Number</TableHead>
                    <TableHead className="font-semibold text-center">Invoices</TableHead>
                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                    <TableHead className="font-semibold text-right">Taxable Value</TableHead>
                    <TableHead className="font-semibold text-right">Total GST</TableHead>
                    <TableHead className="font-semibold text-right">Invoice Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRevenues.map((client, index) => (
                    <TableRow key={client.clientId} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{client.clientCode}</TableCell>
                      <TableCell className="font-medium">{client.clientName}</TableCell>
                      <TableCell className="text-sm font-mono">{client.gstNumber}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {client.invoiceCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{client.totalQuantity.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-mono">
                        {client.taxableValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {client.totalGst.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {client.invoiceValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-semibold">
                    <TableCell colSpan={3} className="text-right">
                      TOTALS:
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {totals.invoiceCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{totals.totalQuantity.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.taxableValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.totalGst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-lg">
                      {totals.invoiceValue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
