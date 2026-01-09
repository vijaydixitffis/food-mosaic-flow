import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X } from 'lucide-react';
import { CompanyInfo } from '@/components/common/CompanyInfo';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import './invoice-print.css';
import html2pdf from 'html2pdf.js';

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
    product_prices?: {
      id: string;
      product_id: string;
      category_id: string;
      sale_price: number;
    } | null;
  }>;
};

interface InvoiceProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function Invoice({ order, isOpen, onClose }: InvoiceProps) {
  if (!isOpen) return null;

  // Helper function to get the correct sale price for a product based on category-specific pricing
  const getProductPrice = (orderProduct: Order['order_products'][0]) => {
    // First try to get category-specific price from product_prices
    if (orderProduct.product_prices) {
      return orderProduct.product_prices.sale_price;
    }
    
    // Fallback to product's default sale price
    return orderProduct.products.sale_price || 0;
  };

  // Fetch company params
  const { data: companyParams = [] } = useQuery({
    queryKey: ['company-params'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_params')
        .select('*')
        .eq('flag', true); // Only fetch params marked for invoice

      if (error) {
        console.error('Error fetching company params:', error);
        return [];
      }

      return data || [];
    },
  });

  // Helper function to get parameter value by key
  const getParamValue = (key: string) => {
    const param = companyParams.find(p => p.key === key);
    return param?.value || '';
  };

  // Helper function to get parameters that contain specific keywords
  const getParamsByKeyword = (keyword: string) => {
    return companyParams.filter(p => 
      p.key.toLowerCase().includes(keyword.toLowerCase()) && p.value
    );
  };

  // Helper function to get bank-related parameters
  const getBankParams = () => {
    return getParamsByKeyword('bank');
  };

  // Helper function to get parameter by specific keywords
  const getParamByKeywords = (...keywords: string[]) => {
    return companyParams.find(p => 
      keywords.some(keyword => p.key.toLowerCase().includes(keyword.toLowerCase())) && p.value
    );
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  // GST calculation helpers
  // Reverse calculate GST amount from GST-inclusive price
  function calcProductGSTAmount(rate: number, gstPercent: number, qty: number) {
    if (!gstPercent || gstPercent <= 0) return 0;
    // GST amount = (rate * qty) * gstPercent / (100 + gstPercent)
    return (rate * qty) * gstPercent / (100 + gstPercent);
  }

  // Calculate base price (excluding GST, before discount, using product GST%)
  function calcBasePrice(rate: number, gstPercent: number) {
    return gstPercent > 0 ? rate / (1 + gstPercent / 100) : rate;
  }

  // Calculate discount amount for a line item
  function calcDiscountAmount(basePrice: number, clientDiscount: number, qty: number) {
    return basePrice * qty * (clientDiscount / 100);
  }

  // Calculate discounted price per unit
  function calcDiscountedPrice(basePrice: number, clientDiscount: number) {
    return basePrice * (1 - clientDiscount / 100);
  }

  // Calculate taxable value (Discounted Price × Quantity)
  function calcTaxableValue(basePrice: number, clientDiscount: number, qty: number) {
    const discountedPrice = calcDiscountedPrice(basePrice, clientDiscount);
    return discountedPrice * qty;
  }

  // Calculate GST amount on taxable value
  function calcGSTOnTaxableValue(taxableValue: number, gstPercent: number) {
    return taxableValue * (gstPercent / 100);
  }

  // Calculate total (Taxable Value + GST Amount)
  function calcTotal(taxableValue: number, gstAmount: number) {
    return taxableValue + gstAmount;
  }

  // For totals
  let totalGST = 0;
  let totalTaxableValue = 0;
  let totalDiscountAmount = 0;

  // Sum of all product GSTs
  const totalGSTOriginal = order.order_products.reduce((sum, item) => {
    const rate = getProductPrice(item);
    const qty = item.number_of_pouches;
    const gstPercent = item.products?.gst || 0;
    return sum + calcProductGSTAmount(rate, gstPercent, qty);
  }, 0);

  // Total Amount: sum of all product item amounts (sale_price * quantity)
  const totalAmount = order.order_products.reduce((sum, item) => {
    const rate = getProductPrice(item);
    const quantity = item.number_of_pouches;
    return sum + (rate * quantity);
  }, 0);

  // Discount
  const discountPercent = order.clients.discount || 0;
  const discountAmount = order.order_products.reduce((sum, item) => {
    const rate = getProductPrice(item);
    const quantity = item.number_of_pouches;
    return sum + (rate * quantity) * (discountPercent / 100);
  }, 0);

  // Taxable value (GST-inclusive minus discount)
  const taxableValue = totalAmount - discountAmount;
  // Proportionally reduce GST if discount is applied
  const totalGSTAfterDiscount = taxableValue === totalAmount ? totalGSTOriginal : totalGSTOriginal * (taxableValue / totalAmount);
  // Final total
  const finalTotal = taxableValue;

  // Grand Total: (Total Amount - Discount) + Total GST
  // (Total GST is now calculated on discounted base price, fixed 12% GST)
  // We'll sum GST per item below
  const grandTotal = (totalAmount - discountAmount) + totalGST;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    html2pdf()
      .set({
        margin: 0.15,
        filename: `Invoice-${order.order_code}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .from(element)
      .save();
  };

  const invoiceNumber = generateInvoiceNumber();
  const currentDate = new Date().toLocaleDateString('en-IN');
  
  // Determine invoice title based on order status
  const invoiceTitle = order.status === 'NEW' ? 'PROFORMA INVOICE' : 'TAX INVOICE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <h2 className="text-lg font-bold text-gray-900 flex-1 text-center">{invoiceTitle}</h2>
            <div className="flex gap-2 no-print flex-1 justify-end">
              <Button onClick={handlePrint} variant="outline" size="sm" title="Print">
                <Printer className="w-4 h-4" />
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm" title="Download">
                <Download className="w-4 h-4" />
              </Button>
              <Button onClick={onClose} variant="outline" size="sm" title="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div id="invoice-content" className="bg-white p-8 border rounded-lg text-xs">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <CompanyInfo variant="invoice" />
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <p><span className="font-semibold">Invoice No:</span> {invoiceNumber}</p>
                  <p><span className="font-semibold">Date:</span> {currentDate}</p>
                  <p><span className="font-semibold">Order No:</span> {order.order_code}</p>
                  <p><span className="font-semibold">Order Date:</span> {order.order_date}</p>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Bill To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{order.clients.name}</p>
                  <p>{order.clients.office_address}</p>
                  <p>Phone: {order.clients.office_phone_number}</p>
                  <p>Contact: {order.clients.contact_person}</p>
                  <p>GST: {order.clients.gst_number}</p>
                  <p>Client Code: {order.clients.client_code}</p>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Ship To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{order.clients.name}</p>
                  <p>{order.clients.office_address}</p>
                  <p>Phone: {order.clients.office_phone_number}</p>
                  <p>Contact: {order.clients.contact_person}</p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1 py-0.5">Sr.</th>
                    <th className="border border-gray-300 px-1 py-0.5">Product Name</th>
                    <th className="border border-gray-300 px-1 py-0.5">HSN Code</th>
                    <th className="border border-gray-300 px-1 py-0.5">MRP (₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5">Qty</th>
                    <th className="border border-gray-300 px-1 py-0.5">Base Rate (₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5">Taxable Amt. (₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5">GST</th>
                    {order.clients.is_igst ? (
                      <th className="border border-gray-300 px-4 py-2">IGST</th>
                    ) : (
                      <>
                        <th className="border border-gray-300 px-4 py-2">CGST</th>
                        <th className="border border-gray-300 px-4 py-2">SGST</th>
                      </>
                    )}
                    <th className="border border-gray-300 px-4 py-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_products.map((item, index) => {
                    const rate = getProductPrice(item);
                    const quantity = item.number_of_pouches;
                    const gstPercent = item.products?.gst || 0;
                    const clientDiscount = order.clients.discount || 0;
                    const basePrice = calcBasePrice(rate, gstPercent);
                    const discountedBasePrice = calcDiscountedPrice(basePrice, clientDiscount);
                    const discountAmount = calcDiscountAmount(basePrice, clientDiscount, quantity);
                    const taxableValue = calcTaxableValue(basePrice, clientDiscount, quantity);
                    const gstAmount = calcGSTOnTaxableValue(taxableValue, gstPercent);
                    const total = calcTotal(taxableValue, gstAmount);
                    
                    totalGST += gstAmount;
                    totalTaxableValue += taxableValue;
                    totalDiscountAmount += discountAmount;
                    
                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-1 py-0.5">
                          {(item.products?.name || 'Unknown Product').toUpperCase()}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {item.products?.hsn_code || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          ₹{rate.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {quantity}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          ₹{discountedBasePrice.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          ₹{taxableValue.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {gstPercent}%
                        </td>
                        {order.clients.is_igst ? (
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            ₹{gstAmount.toFixed(2)}
                          </td>
                        ) : (
                          <>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              ₹{(gstAmount / 2).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              ₹{(gstAmount / 2).toFixed(2)}
                            </td>
                          </>
                        )}
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          ₹{total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total Taxable Value:</span>
                  <span>₹{totalTaxableValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Discount Amount:</span>
                  <span>₹{totalDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total GST:</span>
                  <span>₹{totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{(totalTaxableValue + totalGST).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Declaration */}
            {(() => {
              const declarationParam = getParamByKeywords('declaration');
              return declarationParam && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Declaration:</h3>
                  <div className="text-sm text-gray-600">
                    <p>{declarationParam.value}</p>
                  </div>
                </div>
              );
            })()}

            {/* Bank Details */}
            {(() => {
              const bankParams = getBankParams();
              return bankParams.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Bank Details:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {bankParams.map((param) => (
                      <p key={param.id}>
                        <span className="font-semibold">
                          {param.key.charAt(0).toUpperCase() + param.key.slice(1).replace(/_/g, '')}:
                        </span> {param.value}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Terms and Conditions */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                {(() => {
                  const termsParam = getParamByKeywords('terms_conditions');
                  return termsParam ? (
                    termsParam.value.replace(/\\n/g, '\n')
                  ) : (
                    `1. Payment is due within 30 days of invoice date.
2. Goods once sold will not be taken back.
3. Interest will be charged on overdue payments.
4. All disputes are subject to local jurisdiction.
5. Delivery will be made as per agreed schedule.`
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end">
              <div className="text-sm text-gray-600">
                <p>Thank you for your business!</p>
                <p>For any queries, please contact us.</p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-300 pt-2 w-32 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const signatoryParam = getParamByKeywords('authorized', 'signatory', 'signature');
                    return signatoryParam ? signatoryParam.value : 'Authorized Signature';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 