import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X, Edit2 } from 'lucide-react';
import { CompanyInfo } from '@/components/common/CompanyInfo';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { InvoiceNumberDialog } from './InvoiceNumberDialog';
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
      pack_type: string | null;
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
  invoiceNumber?: string;
  onInvoiceNumberChange?: (number: string) => void;
}

export function Invoice({ 
  order, 
  isOpen, 
  onClose, 
  invoiceNumber: propInvoiceNumber = '',
  onInvoiceNumberChange 
}: InvoiceProps) {
  if (!isOpen) return null;
  
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState(propInvoiceNumber);
  const [showInvoiceNumberDialog, setShowInvoiceNumberDialog] = useState(false);

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

  // Get the invoice number prefix from company params
  const invoiceNumberPrefix = useMemo(() => {
    const param = companyParams.find(p => p.key === 'invoice_number_prefix');
    return param?.value || 'INV-';
  }, [companyParams]);

  // Generate a default invoice number if not provided
  const defaultInvoiceNumber = useMemo(() => {
    return `${invoiceNumberPrefix}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  }, [invoiceNumberPrefix]);

  // Get the full invoice number (prefix + user number)
  const fullInvoiceNumber = useMemo(() => {
    if (localInvoiceNumber) {
      return `${invoiceNumberPrefix}${localInvoiceNumber}`;
    }
    return defaultInvoiceNumber;
  }, [localInvoiceNumber, invoiceNumberPrefix, defaultInvoiceNumber]);

  const handleInvoiceNumberSave = (number: string) => {
    setLocalInvoiceNumber(number);
    if (onInvoiceNumberChange) {
      onInvoiceNumberChange(number);
    }
  };

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
// Calculate total MRP value (MRP * Quantity for all products)
const totalMRPValue = order.order_products.reduce((sum, item) => {
  const mrp = getProductPrice(item); // This gets the MRP
  const quantity = item.number_of_pouches;
  return sum + (mrp * quantity);
}, 0);
  // Number to words conversion function
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    // Split into integer and decimal parts
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let words = '';
    
    // Convert integer part
    if (integerPart < 20) {
      words = ones[integerPart];
    } else if (integerPart < 100) {
      words = tens[Math.floor(integerPart / 10)] + ' ' + ones[integerPart % 10];
    } else if (integerPart < 1000) {
      words = ones[Math.floor(integerPart / 100)] + ' Hundred ' + (integerPart % 100 !== 0 ? numberToWords(integerPart % 100) : '');
    } else if (integerPart < 100000) {
      words = numberToWords(Math.floor(integerPart / 1000)) + ' Thousand ' + (integerPart % 1000 !== 0 ? numberToWords(integerPart % 1000) : '');
    } else if (integerPart < 10000000) {
      words = numberToWords(Math.floor(integerPart / 100000)) + ' Lakh ' + (integerPart % 100000 !== 0 ? numberToWords(integerPart % 100000) : '');
    }
    
    // Add decimal part if exists
    if (decimalPart > 0) {
      words += ' and ' + numberToWords(decimalPart) + ' Paise';
    }
    
    return words.trim();
  };

  // Calculate total (Taxable Value + GST Amount)
  function calcTotal(taxableValue: number, gstAmount: number) {
    return taxableValue + gstAmount;
  }

  // Round amount based on paise value
  function roundAmount(amount: number): number {
    const decimalPart = amount - Math.floor(amount);
    return decimalPart < 0.50 ? Math.ceil(amount) : Math.floor(amount);
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
    
    // Add a class to trigger PDF-specific styles
    element.classList.add('pdf-export');
    
    // Wait a frame for CSS to apply before calculating dimensions
    requestAnimationFrame(() => {
      // Calculate optimal scale to fit content on one A4 page
      // A4 dimensions: 8.27 x 11.69 inches (210 x 297 mm)
      // Accounting for margins: usable area
      const margin = 0.08; // Increased margin for better content accommodation
      const a4Width = 8.27; // inches
      const a4Height = 11.69; // inches
      
      // Use smaller scale for html2canvas to capture more content
      // Combined with CSS scaling, this should fit everything on one page
      html2pdf()
        .set({
          margin: [margin, margin, margin, margin], // [top, right, bottom, left] in inches
          filename: `Invoice-${order.order_code}.pdf`,
          image: { type: 'png', quality: 1 }, // Use PNG for better text quality
          html2canvas: { 
            scale: 2, // Higher scale for sharper text rendering
            useCORS: true,
            letterRendering: true,
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            allowTaint: true,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 0
          },
          jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait',
            compress: false // Disable compression for better quality
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
          enableLinks: false
        })
        .from(element)
        .save()
        .then(() => {
          // Remove the class after PDF generation
          element.classList.remove('pdf-export');
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
          element.classList.remove('pdf-export');
        });
    });
  };

  const invoiceNumber = fullInvoiceNumber;
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
                  <div>
                    <span className="font-semibold">Invoice No:</span>
                    <span>{invoiceNumber}</span>
                  </div>
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
              <table className="w-full border-collapse border border-gray-300" style={{fontSize: '11px', scale: 1.05, transformOrigin: 'center' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1 py-0.5 text-center">Sr.</th>
                    <th className="border border-gray-300">Product Name</th>
                    <th className="border border-gray-300 px-1 py-0.5 text-center">Weight <br/> (g)</th>
                    <th className="border border-gray-300 px-1 py-0.5 text-center">HSN Code</th>
                    <th className="border border-gray-300 px-2 py-0.5 text-center whitespace-nowrap">MRP <br/>(₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5 text-center">Qty</th>
                    <th className="border border-gray-300 px-1 py-0.5 text-center">Base <br/> Rate (₹)</th>
                    <th className="border border-gray-300 px-2 py-0.5 text-center whitespace-nowrap">Taxable<br/> Amt. (₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5 text-center">GST</th>
                    {order.clients.is_igst ? (
                      <th className="border border-gray-300 px-4 py-1 text-center">IGST</th>
                    ) : (
                      <>
                        <th className="border border-gray-300 px-4 py-1 text-center">CGST</th>
                        <th className="border border-gray-300 px-4 py-1 text-center">SGST</th>
                      </>
                    )}
                    <th className="border border-gray-300 px-4 py-1 text-center">Total (₹)</th>
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
                        <td className="border border-gray-300">
                          {(item.products?.name || 'Unknown Product').toUpperCase()}
                        </td>
                        <td className="border border-gray-300 px-0.5 py-0.5 text-center">
                          {item.pouch_size || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {item.products?.hsn_code || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right whitespace-nowrap">
                          ₹{rate.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {quantity}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-right whitespace-nowrap">
                          ₹{discountedBasePrice.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-2 py-0.5 text-right whitespace-nowrap">
                          ₹{taxableValue.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-right whitespace-nowrap">
                          {gstPercent}%
                        </td>
                        {order.clients.is_igst ? (
                          <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap">
                            ₹{gstAmount.toFixed(2)}
                          </td>
                        ) : (
                          <>
                            <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap">
                              ₹{(gstAmount / 2).toFixed(2)}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-right whitespace-nowrap">
                              ₹{(gstAmount / 2).toFixed(2)}
                            </td>
                          </>
                        )}
                        <td className="border border-gray-300 px-4 py-2 text-right whitespace-nowrap">
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
  <span>Total MRP Value:</span>
  <span>₹{totalMRPValue.toFixed(2)}</span>
</div>
                <div className="flex justify-between">
                  <span>Total Discount Amount:</span>
                  <span>₹{totalDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Taxable Value:</span>
                  <span>₹{totalTaxableValue.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Total GST:</span>
                  <span>₹{totalGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{roundAmount(totalTaxableValue + totalGST).toFixed(2)}</span>
                </div>
                
              </div>
            </div>

            {/*Amount in words*/}
            <div className="mb-8">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Amount in words:</h3>
                  <span className="font-semibold">Rupees {numberToWords(roundAmount(totalTaxableValue + totalGST))} Only</span>
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
{(() => {
  const termsParam = getParamByKeywords('terms_and_conditions');
  if (!termsParam || !termsParam.value) return null;
  
  // Process the text to handle both bullet points and newlines
  const processText = (text: string) => {
    // First, split by lines
    const lines = text
      .replace(/\\n/g, '\n')  // Replace literal \n
      .replace(/\\r\\n/g, '\n')  // Replace literal \r\n
      .replace(/\\r/g, '\n')  // Replace literal \r
      .replace(/\r\n/g, '\n')  // Windows line endings
      .replace(/\r/g, '\n')  // Mac line endings
      .split('\n');  // Split into lines

    return lines.map((line, index) => {
      // Check for bullet points (lines starting with - or *)
      if (/^[\s]*[-*•]/.test(line)) {
        return (
          <div key={index} className="flex items-start">
            <span className="mr-2">•</span>
            <span>{line.replace(/^[\s]*[-*•]\s*/, '')}</span>
          </div>
        );
      }
      // Check for numbered lists (lines starting with 1., 2., etc.)
      else if (/^[\s]*\d+\./.test(line)) {
        return (
          <div key={index} className="flex items-start">
            <span className="mr-2">{line.match(/^[\s]*\d+\./)?.[0]}</span>
            <span>{line.replace(/^[\s]*\d+\.\s*/, '')}</span>
          </div>
        );
      }
      // Regular line with text
      return <div key={index} className={index > 0 ? 'mt-2' : ''}>{line}</div>;
    });
  };

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
      <div className="text-sm text-gray-600 space-y-1">
        {processText(termsParam.value)}
      </div>
    </div>
  );
})()}

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
          
          {/* Invoice Number Dialog */}
          <InvoiceNumberDialog
            isOpen={showInvoiceNumberDialog}
            onClose={() => setShowInvoiceNumberDialog(false)}
            onSave={handleInvoiceNumberSave}
            initialValue={localInvoiceNumber}
          />
        </div>
      </div>
    </div>
  );
} 