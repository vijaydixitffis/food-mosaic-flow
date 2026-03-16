import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X, Truck } from 'lucide-react';
import { CompanyInfo } from '@/components/common/CompanyInfo';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { DeliveryChallanNumberDialog } from './DeliveryChallanNumberDialog';
import '../invoice/invoice-print.css';
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

interface DeliveryChallanProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  deliveryChallanNumber?: string;
  onDeliveryChallanNumberChange?: (number: string) => void;
}

export function DeliveryChallan({ 
  order, 
  isOpen, 
  onClose, 
  deliveryChallanNumber: propDeliveryChallanNumber = '',
  onDeliveryChallanNumberChange 
}: DeliveryChallanProps) {
  if (!isOpen) return null;
  
  const [localDeliveryChallanNumber, setLocalDeliveryChallanNumber] = useState(propDeliveryChallanNumber);
  const [showDeliveryChallanNumberDialog, setShowDeliveryChallanNumberDialog] = useState(false);

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

  // Get the delivery challan number prefix from company params
  const deliveryChallanNumberPrefix = useMemo(() => {
    const param = companyParams.find(p => p.key === 'delivery_challan_number_prefix');
    return param?.value || 'DC-';
  }, [companyParams]);

  // Generate a default delivery challan number if not provided
  const defaultDeliveryChallanNumber = useMemo(() => {
    return `${deliveryChallanNumberPrefix}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  }, [deliveryChallanNumberPrefix]);

  // Get the full delivery challan number (prefix + user number)
  const fullDeliveryChallanNumber = useMemo(() => {
    if (localDeliveryChallanNumber) {
      return `${deliveryChallanNumberPrefix}${localDeliveryChallanNumber}`;
    }
    return defaultDeliveryChallanNumber;
  }, [localDeliveryChallanNumber, deliveryChallanNumberPrefix, defaultDeliveryChallanNumber]);

  const handleDeliveryChallanNumberSave = (number: string) => {
    setLocalDeliveryChallanNumber(number);
    if (onDeliveryChallanNumberChange) {
      onDeliveryChallanNumberChange(number);
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

  const generateDeliveryChallanNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DC-${year}${month}${day}-${random}`;
  };

  // Calculate total value based on MRP
  const totalMRPValue = order.order_products.reduce((sum, item) => {
    const mrp = getProductPrice(item); // This gets the MRP
    const quantity = item.number_of_pouches;
    return sum + (mrp * quantity);
  }, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('delivery-challan-content');
    if (!element) return;
    
    // Add a class to trigger PDF-specific styles
    element.classList.add('pdf-export');
    
    // Wait a frame for CSS to apply before calculating dimensions
    requestAnimationFrame(() => {
      // Calculate optimal scale to fit content on one A4 page
      // A4 dimensions: 8.27 x 11.69 inches (210 x 297 mm)
      // Accounting for margins: usable area
      const margin = 0.15; // Reduced margin for more space
      const a4Width = 8.27; // inches
      const a4Height = 11.69; // inches
      
      // Use smaller scale for html2canvas to capture more content
      // Combined with CSS scaling, this should fit everything on one page
      html2pdf()
        .set({
          margin: [margin, margin, margin, margin], // [top, right, bottom, left] in inches
          filename: `DeliveryChallan-${order.order_code}.pdf`,
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

  const deliveryChallanNumber = fullDeliveryChallanNumber;
  const currentDate = new Date().toLocaleDateString('en-IN');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <h2 className="text-lg font-bold text-gray-900 flex-1 text-center">DELIVERY CHALLAN</h2>
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

          <div id="delivery-challan-content" className="bg-white p-8 border rounded-lg text-xs">
            {/* Delivery Challan Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <CompanyInfo variant="delivery-challan" />
              </div>
              <div className="text-right">
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-semibold">DC No:</span>
                    <span>{deliveryChallanNumber}</span>
                  </div>
                  <p><span className="font-semibold">Date:</span> {currentDate}</p>
                  <p><span className="font-semibold">Order No:</span> {order.order_code}</p>
                  <p><span className="font-semibold">Order Date:</span> {order.order_date}</p>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="mb-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Ship To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{order.clients.name}</p>
                  <p>{order.clients.office_address}</p>
                  <p>Phone: {order.clients.office_phone_number}</p>
                  <p>Contact: {order.clients.contact_person}</p>
                  <p>Client Code: {order.clients.client_code}</p>
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
                    <th className="border border-gray-300 px-1 py-0.5">Weight (g)</th>
                    <th className="border border-gray-300 px-1 py-0.5">MRP (₹)</th>
                    <th className="border border-gray-300 px-1 py-0.5">Qty</th>
                    <th className="border border-gray-300 px-1 py-0.5">Total Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_products.map((item, index) => {
                    const mrp = getProductPrice(item);
                    const quantity = item.number_of_pouches;
                    const totalValue = mrp * quantity;
                    
                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-1 py-0.5">
                          {item.products?.name || 'Unknown Product'}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {item.pouch_size || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          ₹{mrp.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          {quantity}
                        </td>
                        <td className="border border-gray-300 px-1 py-0.5 text-center">
                          ₹{totalValue.toFixed(2)}
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
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total Value of Goods:</span>
                  <span>₹{totalMRPValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            
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
            <div className="flex justify-end items-end">
              <div className="text-center">
                <div className="border-t-2 border-gray-300 pt-2 w-32 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const signatoryParam = getParamByKeywords('authorized', 'signatory', 'signature');
                    return signatoryParam ? signatoryParam.value : 'Mimasa Foods Pvt Ltd';
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Delivery Challan Number Dialog */}
          <DeliveryChallanNumberDialog
            isOpen={showDeliveryChallanNumberDialog}
            onClose={() => setShowDeliveryChallanNumberDialog(false)}
            onSave={handleDeliveryChallanNumberSave}
            initialValue={localDeliveryChallanNumber}
          />
        </div>
      </div>
    </div>
  );
}
