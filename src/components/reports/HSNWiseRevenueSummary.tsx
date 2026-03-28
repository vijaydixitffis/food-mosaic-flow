import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Download, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  clients: {
    id: string;
    name: string;
    client_code: string;
    discount: number;
    is_igst: boolean;
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

type ProductRevenue = {
  productId: string;
  productName: string;
  hsnCode: string;
  gstRate: number;
  invoiceCount: number;
  totalQuantity: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  invoiceValue: number;
};

interface HSNWiseRevenueSummaryProps {
  startDate: string;
  endDate: string;
}

export function HSNWiseRevenueSummary({ startDate, endDate }: HSNWiseRevenueSummaryProps) {
  // Fetch orders within date range
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['hsn-wise-revenue', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            id,
            name,
            client_code,
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
    (window as any).hsnWiseRevenueRefetch = refetch;
    return () => {
      delete (window as any).hsnWiseRevenueRefetch;
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

  // Transform orders into product revenue summary (product-wise entries)
  const productRevenues: ProductRevenue[] = useMemo(() => {
    if (!ordersData) return [];

    const productMap = new Map<string, ProductRevenue>();

    ordersData.forEach(order => {
      const isIGST = order.clients?.is_igst || false;

      order.order_products.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || '';
        const hsnCode = item.products?.hsn_code || '0000';
        const gstRate = item.products?.gst || 0;

        const rate = getProductPrice(item);
        const quantity = item.number_of_pouches;
        const clientDiscount = order.clients?.discount || 0;

        const basePrice = calcBasePrice(rate, gstRate);
        const taxableValue = calcTaxableValue(basePrice, clientDiscount, quantity);
        const gstAmount = calcGSTOnTaxableValue(taxableValue, gstRate);

        let cgst = 0, sgst = 0, igst = 0;
        if (isIGST) {
          igst = gstAmount;
        } else {
          cgst = gstAmount / 2;
          sgst = gstAmount / 2;
        }

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.invoiceCount += 1;
          existing.totalQuantity += quantity;
          existing.taxableValue += taxableValue;
          existing.cgstAmount += cgst;
          existing.sgstAmount += sgst;
          existing.igstAmount += igst;
          existing.totalGst += gstAmount;
          existing.invoiceValue += taxableValue + gstAmount;
        } else {
          productMap.set(productId, {
            productId,
            productName,
            hsnCode,
            gstRate,
            invoiceCount: 1,
            totalQuantity: quantity,
            taxableValue,
            cgstAmount: cgst,
            sgstAmount: sgst,
            igstAmount: igst,
            totalGst: gstAmount,
            invoiceValue: taxableValue + gstAmount,
          });
        }
      });
    });

    // Convert to array and sort by total quantity descending (popularity), then invoice value
    return Array.from(productMap.values()).sort((a, b) => {
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity; // Primary: Quantity desc (popularity)
      }
      return b.invoiceValue - a.invoiceValue; // Secondary: Invoice value desc
    });
  }, [ordersData]);

  // Calculate totals
  const totals = useMemo(() => {
    return productRevenues.reduce(
      (acc, product) => ({
        invoiceCount: acc.invoiceCount + product.invoiceCount,
        totalQuantity: acc.totalQuantity + product.totalQuantity,
        taxableValue: acc.taxableValue + product.taxableValue,
        cgstAmount: acc.cgstAmount + product.cgstAmount,
        sgstAmount: acc.sgstAmount + product.sgstAmount,
        igstAmount: acc.igstAmount + product.igstAmount,
        totalGst: acc.totalGst + product.totalGst,
        invoiceValue: acc.invoiceValue + product.invoiceValue,
      }),
      { 
        invoiceCount: 0, 
        totalQuantity: 0, 
        taxableValue: 0, 
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalGst: 0, 
        invoiceValue: 0 
      }
    );
  }, [productRevenues]);

  const handleExportCSV = () => {
    const headers = [
      'Product Name',
      'HSN Code',
      'GST Rate %',
      'Entries',
      'Total Quantity',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total GST',
      'Invoice Value',
    ];

    const rows = productRevenues.map(product => [
      product.productName,
      product.hsnCode,
      product.gstRate,
      product.invoiceCount,
      product.totalQuantity,
      product.taxableValue.toFixed(2),
      product.cgstAmount.toFixed(2),
      product.sgstAmount.toFixed(2),
      product.igstAmount.toFixed(2),
      product.totalGst.toFixed(2),
      product.invoiceValue.toFixed(2),
    ]);

    // Add totals row
    rows.push([
      'TOTAL',
      '',
      '',
      totals.invoiceCount,
      totals.totalQuantity,
      totals.taxableValue.toFixed(2),
      totals.cgstAmount.toFixed(2),
      totals.sgstAmount.toFixed(2),
      totals.igstAmount.toFixed(2),
      totals.totalGst.toFixed(2),
      totals.invoiceValue.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Product_Wise_Revenue_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading HSN-wise Revenue Summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading HSN-wise Revenue Summary: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              HSN-wise Revenue Summary
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
              <p className="text-xs text-gray-500">Total Products</p>
              <p className="text-lg font-semibold">{productRevenues.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-xs text-gray-500">Total Entries</p>
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-600">CGST</p>
              <p className="text-xl font-bold text-blue-700 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {totals.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-600">SGST</p>
              <p className="text-xl font-bold text-blue-700 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {totals.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-600">IGST</p>
              <p className="text-xl font-bold text-orange-700 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {totals.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="bg-green-100 rounded-lg px-6 py-3">
              <p className="text-sm text-gray-600">Total Revenue (incl. GST)</p>
              <p className="text-2xl font-bold text-green-700 flex items-center gap-1">
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
            Product-wise Breakdown
            <span className="text-sm font-normal text-gray-500 ml-2">
              (sorted by quantity - most popular first)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productRevenues.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="font-semibold">HSN Code</TableHead>
                    <TableHead className="font-semibold text-center">GST %</TableHead>
                    <TableHead className="font-semibold text-center">Entries</TableHead>
                    <TableHead className="font-semibold text-right">Quantity</TableHead>
                    <TableHead className="font-semibold text-right">Taxable Value</TableHead>
                    <TableHead className="font-semibold text-right">CGST</TableHead>
                    <TableHead className="font-semibold text-right">SGST</TableHead>
                    <TableHead className="font-semibold text-right">IGST</TableHead>
                    <TableHead className="font-semibold text-right">Total GST</TableHead>
                    <TableHead className="font-semibold text-right">Invoice Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productRevenues.map((product, index) => (
                    <TableRow key={product.productId} className="hover:bg-gray-50">
                      <TableCell className="text-gray-500 w-8">{index + 1}</TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{product.hsnCode}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {product.gstRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {product.invoiceCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {product.totalQuantity.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.taxableValue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.cgstAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.sgstAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.igstAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {product.totalGst.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {product.invoiceValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-semibold">
                    <TableCell colSpan={4} className="text-right">
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
                      {totals.cgstAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.sgstAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totals.igstAmount.toFixed(2)}
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
