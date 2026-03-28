import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, IndianRupee } from 'lucide-react';
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

type GSTLineItem = {
  orderId: string;
  orderCode: string;
  orderDate: string;
  clientName: string;
  clientGstNumber: string;
  hsnCode: string;
  productName: string;
  quantity: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  invoiceValue: number;
};

interface GSTSalesRegisterProps {
  startDate: string;
  endDate: string;
}

export function GSTSalesRegister({ startDate, endDate }: GSTSalesRegisterProps) {
  // Fetch invoiced orders within date range
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['gst-sales-register', startDate, endDate],
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
    (window as any).gstSalesRegisterRefetch = refetch;
    return () => {
      delete (window as any).gstSalesRegisterRefetch;
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

  // Transform orders into GST line items and consolidate by Invoice + HSN
  const gstLineItems: GSTLineItem[] = useMemo(() => {
    if (!ordersData) return [];

    const consolidatedMap = new Map<string, GSTLineItem>();

    ordersData.forEach(order => {
      order.order_products.forEach(item => {
        const rate = getProductPrice(item);
        const quantity = item.number_of_pouches;
        const gstRate = item.products?.gst || 0;
        const clientDiscount = order.clients?.discount || 0;
        const isIgst = order.clients?.is_igst || false;
        const hsnCode = item.products?.hsn_code || '';

        const basePrice = calcBasePrice(rate, gstRate);
        const taxableValue = calcTaxableValue(basePrice, clientDiscount, quantity);
        const gstAmount = calcGSTOnTaxableValue(taxableValue, gstRate);

        // Create unique key for consolidation: OrderCode + HSN + GST Rate + IGST flag
        const consolidationKey = `${order.order_code}|${hsnCode}|${gstRate}|${isIgst}`;

        if (consolidatedMap.has(consolidationKey)) {
          // Add to existing consolidated entry
          const existing = consolidatedMap.get(consolidationKey)!;
          existing.quantity += quantity;
          existing.taxableValue += taxableValue;
          existing.cgst += isIgst ? 0 : gstAmount / 2;
          existing.sgst += isIgst ? 0 : gstAmount / 2;
          existing.igst += isIgst ? gstAmount : 0;
          existing.totalGst += gstAmount;
          existing.invoiceValue += taxableValue + gstAmount;
          // Append product name if different
          if (!existing.productName.includes(item.products?.name || '')) {
            existing.productName += `, ${item.products?.name || ''}`;
          }
        } else {
          // Create new consolidated entry
          consolidatedMap.set(consolidationKey, {
            orderId: order.id,
            orderCode: order.order_code,
            orderDate: order.order_date || '',
            clientName: order.clients?.name || '',
            clientGstNumber: order.clients?.gst_number || '',
            hsnCode: hsnCode,
            productName: item.products?.name || '',
            quantity,
            taxableValue,
            gstRate,
            cgst: isIgst ? 0 : gstAmount / 2,
            sgst: isIgst ? 0 : gstAmount / 2,
            igst: isIgst ? gstAmount : 0,
            totalGst: gstAmount,
            invoiceValue: taxableValue + gstAmount,
          });
        }
      });
    });

    // Convert map to array and sort by order date
    return Array.from(consolidatedMap.values()).sort((a, b) => {
      return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    });
  }, [ordersData]);

  // Calculate totals
  const totals = useMemo(() => {
    return gstLineItems.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + item.taxableValue,
        cgst: acc.cgst + item.cgst,
        sgst: acc.sgst + item.sgst,
        igst: acc.igst + item.igst,
        totalGst: acc.totalGst + item.totalGst,
        invoiceValue: acc.invoiceValue + item.invoiceValue,
      }),
      { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, invoiceValue: 0 }
    );
  }, [gstLineItems]);

  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Client Name',
      'Client GST No',
      'HSN Code',
      'Product Name',
      'Quantity',
      'Taxable Value',
      'GST Rate',
      'CGST',
      'SGST',
      'IGST',
      'Total GST',
      'Invoice Value',
    ];

    const rows = gstLineItems.map(item => [
      item.orderCode,
      item.orderDate,
      item.clientName,
      item.clientGstNumber,
      item.hsnCode,
      item.productName,
      item.quantity,
      item.taxableValue.toFixed(2),
      item.gstRate,
      item.cgst.toFixed(2),
      item.sgst.toFixed(2),
      item.igst.toFixed(2),
      item.totalGst.toFixed(2),
      item.invoiceValue.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Sales_Register_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading GST Sales Register...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading GST Sales Register: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              GST Sales Register Summary
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total Invoices</p>
              <p className="text-lg font-semibold">{ordersData?.length || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Line Items</p>
              <p className="text-lg font-semibold">{gstLineItems.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Taxable Value</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.taxableValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">CGST</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.cgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">SGST</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.sgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">IGST</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                {totals.igst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="bg-purple-100 rounded-lg px-6 py-3">
              <p className="text-sm text-gray-600">Total Invoice Value (incl. GST)</p>
              <p className="text-2xl font-bold text-purple-700 flex items-center gap-1">
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
            Detailed GST Sales Register
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({startDate} to {endDate})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gstLineItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No invoiced orders found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Invoice No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">GST No</TableHead>
                    <TableHead className="font-semibold text-right">Qty</TableHead>
                    <TableHead className="font-semibold text-center">GST%</TableHead>
                    <TableHead className="font-semibold text-right">CGST</TableHead>
                    <TableHead className="font-semibold text-right">SGST</TableHead>
                    <TableHead className="font-semibold text-right">IGST</TableHead>
                    <TableHead className="font-semibold text-right">Taxable Value</TableHead>
                    <TableHead className="font-semibold text-right">Invoice Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstLineItems.map((item, index) => (
                    <TableRow key={`${item.orderId}-${index}`} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">{item.orderCode}</TableCell>
                      <TableCell className="text-sm">
                        {item.orderDate ? new Date(item.orderDate).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{item.clientName}</TableCell>
                      <TableCell className="text-sm font-mono">{item.clientGstNumber}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {item.gstRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.cgst > 0 ? item.cgst.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.sgst > 0 ? item.sgst.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.igst > 0 ? item.igst.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.taxableValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {item.invoiceValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-semibold">
                    <TableCell colSpan={5} className="text-right">
                      TOTALS:
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.cgst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.sgst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.igst.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.taxableValue.toFixed(2)}
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
