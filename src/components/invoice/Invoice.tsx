import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, X } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import './invoice-print.css';

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
    };
  }>;
};

interface InvoiceProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function Invoice({ order, isOpen, onClose }: InvoiceProps) {
  if (!isOpen) return null;

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const calculateSubtotal = () => {
    return order.order_products.reduce((total, item) => {
      const price = item.products?.sale_price || 0;
      const quantity = item.number_of_pouches;
      return total + (price * quantity);
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * order.clients.discount) / 100;
  };

  const calculateGST = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const taxableAmount = subtotal - discount;
    return (taxableAmount * 18) / 100; // 18% GST
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const gst = calculateGST();
    return subtotal - discount + gst;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a blob with the invoice content
    const invoiceContent = document.getElementById('invoice-content')?.innerHTML || '';
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${order.order_code}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const invoiceNumber = generateInvoiceNumber();
  const currentDate = new Date().toLocaleDateString('en-IN');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <h2 className="text-2xl font-bold text-gray-900 flex-1 text-center">TAX INVOICE</h2>
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

          <div id="invoice-content" className="bg-white p-8 border rounded-lg">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">FOOD MOSAIC</h1>
                <p className="text-gray-600">Food Production & Management System</p>
                <p className="text-gray-600">123 Food Street, Production City</p>
                <p className="text-gray-600">Phone: +91 98765 43210</p>
                <p className="text-gray-600">Email: info@foodmosaic.com</p>
                <p className="text-gray-600">GST: 27ABCDE1234F1Z5</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">INVOICE</h2>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ship To:</h3>
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
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Sr. No.</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Product Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">HSN Code</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Pouch Size</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Qty (Pouches)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Rate (₹)</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_products.map((item, index) => {
                    const rate = item.products?.sale_price || 0;
                    const quantity = item.number_of_pouches;
                    const amount = rate * quantity;
                    
                    return (
                      <tr key={item.id}>
                        <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.products?.name || 'Unknown Product'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.products?.hsn_code || 'N/A'}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.pouch_size}g
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {quantity}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          ₹{rate.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          ₹{amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount ({order.clients.discount}%):</span>
                  <span>-₹{calculateDiscount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{calculateGST().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. Payment is due within 30 days of invoice date.</p>
                <p>2. Goods once sold will not be taken back.</p>
                <p>3. Interest will be charged on overdue payments.</p>
                <p>4. All disputes are subject to local jurisdiction.</p>
                <p>5. Delivery will be made as per agreed schedule.</p>
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
                <p className="text-sm text-gray-600">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 