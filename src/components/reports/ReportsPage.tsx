import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartColumn, ShoppingCart, IndianRupee, Users, Package } from 'lucide-react';
import { OrderSummaryReport } from './OrderSummaryReport';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('orders');

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">GST Sales Register</h3>
                    <p className="text-sm text-gray-600">Invoices with CGST/SGST/IGST breakdown</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Revenue by Client</h3>
                    <p className="text-sm text-gray-600">Total invoiced amount per client</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">HSN-wise Summary</h3>
                    <p className="text-sm text-gray-600">Revenue grouped by product HSN codes</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 text-center text-gray-500">
                <p>More financial reports coming soon...</p>
              </div>
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
