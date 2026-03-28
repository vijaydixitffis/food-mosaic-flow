import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartColumn, ShoppingCart, IndianRupee, Users, Package, Search, Calendar, FileText, Building2, BarChart3 } from 'lucide-react';
import { OrderSummaryReport } from './OrderSummaryReport';
import { GSTSalesRegister } from './GSTSalesRegister';
import { RevenueByClient } from './RevenueByClient';
import { HSNWiseRevenueSummary } from './HSNWiseRevenueSummary';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [activeInvoiceReport, setActiveInvoiceReport] = useState<string | null>(null);
  
  // Helper function to format date as YYYY-MM-DD using local time to avoid timezone issues
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get current FY quarter dates
  const getCurrentFYQuarterDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    let quarterStartMonth: number;
    let quarterEndMonth: number;
    
    if (currentMonth >= 3 && currentMonth <= 5) {
      quarterStartMonth = 3;
      quarterEndMonth = 5;
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      quarterStartMonth = 6;
      quarterEndMonth = 8;
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      quarterStartMonth = 9;
      quarterEndMonth = 11;
    } else {
      quarterStartMonth = 0;
      quarterEndMonth = 2;
    }
    
    const startDateYear = quarterStartMonth >= 3 ? fyStartYear : fyStartYear + 1;
    const startDate = formatDate(new Date(startDateYear, quarterStartMonth, 1));
    
    const endDateYear = quarterEndMonth >= 3 ? fyStartYear : fyStartYear + 1;
    const endDate = formatDate(new Date(endDateYear, quarterEndMonth + 1, 0));
    
    return { startDate, endDate };
  };
  
  // Helper function to get current FY dates (Apr-Mar)
  const getCurrentFYDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    
    const startDate = formatDate(new Date(fyStartYear, 3, 1)); // April 1
    const endDate = formatDate(new Date(fyEndYear, 2, 31)); // March 31
    
    return { startDate, endDate };
  };
  
  const [invoiceDateFromInput, setInvoiceDateFromInput] = useState('');
  const [invoiceDateToInput, setInvoiceDateToInput] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  
  // Reset invoice dates to current FY when tab becomes active
  useEffect(() => {
    if (activeTab === 'invoices') {
      const { startDate, endDate } = getCurrentFYDates();
      setInvoiceDateFromInput(startDate);
      setInvoiceDateToInput(endDate);
      setAppliedDateFrom(startDate);
      setAppliedDateTo(endDate);
    } else {
      setActiveInvoiceReport(null);
    }
  }, [activeTab]);

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <ChartColumn className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-600">Analytics and insights for business decisions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="client-insights" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Client Insights</span>
          </TabsTrigger>
          <TabsTrigger value="product-insights" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Product Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-6">
          <OrderSummaryReport />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <IndianRupee className="w-5 h-5 text-purple-500" />
                Invoices & Financial Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Date Filter Section */}
              <Card className="bg-gray-50 border border-gray-200 mb-6">
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Start Date</span>
                    <Input
                      type="date"
                      value={invoiceDateFromInput}
                      onChange={(e) => setInvoiceDateFromInput(e.target.value)}
                      className="h-8 w-36"
                    />
                    <span className="text-sm font-medium text-gray-700">End Date</span>
                    <Input
                      type="date"
                      value={invoiceDateToInput}
                      onChange={(e) => setInvoiceDateToInput(e.target.value)}
                      className="h-8 w-36"
                    />
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1 h-8"
                      onClick={() => {
                        // Apply the input dates to the report
                        setAppliedDateFrom(invoiceDateFromInput);
                        setAppliedDateTo(invoiceDateToInput);
                        // Trigger refetch for active report
                        if (activeInvoiceReport === 'gst-sales-register') {
                          (window as any).gstSalesRegisterRefetch?.();
                        } else if (activeInvoiceReport === 'revenue-by-client') {
                          (window as any).revenueByClientRefetch?.();
                        } else if (activeInvoiceReport === 'hsn-wise-revenue') {
                          (window as any).hsnWiseRevenueRefetch?.();
                        }
                      }}
                    >
                      <Search className="w-4 h-4" />
                      Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Report Buttons */}
              <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-purple-400 hover:bg-purple-50"
                        onClick={() => {
                          // Set dates to current FY quarter for GST Register
                          const { startDate, endDate } = getCurrentFYQuarterDates();
                          setInvoiceDateFromInput(startDate);
                          setInvoiceDateToInput(endDate);
                          setAppliedDateFrom(startDate);
                          setAppliedDateTo(endDate);
                          setActiveInvoiceReport('gst-sales-register');
                        }}
                      >
                        <FileText className="w-6 h-6 text-purple-500" />
                        <span className="font-semibold">GST Sales Register</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>Invoices with CGST/SGST/IGST breakdown</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-blue-400 hover:bg-blue-50"
                        onClick={() => {
                          // Set dates to full FY for Revenue by Client
                          const { startDate, endDate } = getCurrentFYDates();
                          setInvoiceDateFromInput(startDate);
                          setInvoiceDateToInput(endDate);
                          setAppliedDateFrom(startDate);
                          setAppliedDateTo(endDate);
                          setActiveInvoiceReport('revenue-by-client');
                        }}
                      >
                        <Building2 className="w-6 h-6 text-blue-500" />
                        <span className="font-semibold">Revenue by Client</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>Total invoiced amount per client</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-400 hover:bg-green-50"
                        onClick={() => {
                          // Set dates to full FY for HSN-wise Summary
                          const { startDate, endDate } = getCurrentFYDates();
                          setInvoiceDateFromInput(startDate);
                          setInvoiceDateToInput(endDate);
                          setAppliedDateFrom(startDate);
                          setAppliedDateTo(endDate);
                          setActiveInvoiceReport('hsn-wise-revenue');
                        }}
                      >
                        <BarChart3 className="w-6 h-6 text-green-500" />
                        <span className="font-semibold">HSN-wise Summary</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p>Revenue grouped by product HSN codes</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* Report Content - Shows below buttons when active */}
              {activeInvoiceReport === 'gst-sales-register' && (
                <div className="mt-6">
                  <GSTSalesRegister 
                    startDate={appliedDateFrom} 
                    endDate={appliedDateTo} 
                  />
                </div>
              )}
              {activeInvoiceReport === 'revenue-by-client' && (
                <div className="mt-6">
                  <RevenueByClient 
                    startDate={appliedDateFrom} 
                    endDate={appliedDateTo} 
                  />
                </div>
              )}
              {activeInvoiceReport === 'hsn-wise-revenue' && (
                <div className="mt-6">
                  <HSNWiseRevenueSummary 
                    startDate={appliedDateFrom} 
                    endDate={appliedDateTo} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Insights Tab */}
        <TabsContent value="client-insights" className="mt-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-green-500" />
                Client Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Client Order History</h3>
                    <p className="text-sm text-gray-600">All orders by client with trend analysis</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Top Clients by Volume</h3>
                    <p className="text-sm text-gray-600">Clients ranked by order quantity and value</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Client Category Analysis</h3>
                    <p className="text-sm text-gray-600">Orders grouped by client category</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 text-center text-gray-500">
                <p>More client insights coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Insights Tab */}
        <TabsContent value="product-insights" className="mt-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="w-5 h-5 text-amber-500" />
                Product Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Product Demand Report</h3>
                    <p className="text-sm text-gray-600">Most-ordered products by quantity and value</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Product-Client Matrix</h3>
                    <p className="text-sm text-gray-600">Which clients order which products</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Pouch Size Distribution</h3>
                    <p className="text-sm text-gray-600">Breakdown of orders by pouch sizes</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 text-center text-gray-500">
                <p>More product insights coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
