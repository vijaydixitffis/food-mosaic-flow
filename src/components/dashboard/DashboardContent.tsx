import React from 'react';
import { IngredientsPage } from '@/components/ingredients/IngredientsPage';
import { CompoundsPage } from '@/components/compounds/CompoundsPage';
import { ProductsPage } from '@/components/products/ProductsPage';
import { RecipesPage } from '@/components/recipes/RecipesPage';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { OrdersPage } from '@/components/orders/OrdersPage';
import { WorkOrdersPage } from '@/components/work-orders/WorkOrdersPage';
import { InvoicesPage } from '@/components/invoice/InvoicesPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Carrot, 
  Beaker, 
  Package, 
  BookOpen, 
  Store, 
  Factory, 
  Plus, 
  ClipboardList, 
  ChartColumn, 
  UserPlus,
  Sprout,
  ShoppingCart,
  Users,
  Utensils,
  Layers,
  IndianRupee
} from 'lucide-react';

interface DashboardContentProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardContent({ currentView, onViewChange }: DashboardContentProps) {
  const renderContent = () => {
    switch (currentView) {
      case 'ingredients':
        return <IngredientsPage />;
      case 'compounds':
        return <CompoundsPage />;
      case 'products':
        return <ProductsPage />;
      case 'recipes':
        return <RecipesPage />;
      case 'clients':
        return <ClientsPage />;
      case 'orders':
        return <OrdersPage />;
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'reports':
        return <div className="p-6">Reports Page - Coming Soon</div>;
      default:
        return renderHomeDashboard();
    }
  };

  const renderHomeDashboard = () => {
    return (
      <div className="px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
              Welcome to FoodMosaic
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Your comprehensive food production management system. Manage ingredients, compounds, products, recipes, work orders, and more from this central dashboard.
          </p>
        </div>

        {/* Main Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {/* Ingredients Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Carrot className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-orange-500">248</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Ingredients</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Manage your raw ingredients and their properties with detailed tracking and categorization
              </p>
              <Button 
                onClick={() => onViewChange('ingredients')}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Carrot className="w-5 h-5 mr-2" />
                View Ingredients
              </Button>
            </CardContent>
          </Card>

          {/* Compounds Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-green-500">86</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Compounds</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Create and manage ingredient compounds for efficient production workflows
              </p>
              <Button 
                onClick={() => onViewChange('compounds')}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Layers className="w-5 h-5 mr-2" />
                View Compounds
              </Button>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-amber-500">142</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Products</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Manage your final products and compositions with comprehensive ingredient tracking
              </p>
              <Button 
                onClick={() => onViewChange('products')}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-orange-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                View Products
              </Button>
            </CardContent>
          </Card>

          {/* Recipes Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-orange-500">64</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Recipes</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Create and manage production recipes with step-by-step instructions
              </p>
              <Button 
                onClick={() => onViewChange('recipes')}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-red-500 hover:to-red-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Recipes
              </Button>
            </CardContent>
          </Card>

          {/* Clients Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-green-500">28</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Clients</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Manage your clients and their information with GST and discount tracking
              </p>
              <Button 
                onClick={() => onViewChange('clients')}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium hover:from-teal-500 hover:to-teal-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                View Clients
              </Button>
            </CardContent>
          </Card>

          {/* Orders Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-amber-500">45</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Orders</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Track client orders and manage delivery schedules efficiently
              </p>
              <Button 
                onClick={() => onViewChange('orders')}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-orange-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                View Orders
              </Button>
            </CardContent>
          </Card>

          {/* Work Orders Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Factory className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-green-600">15</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Work Orders</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Create and track production work orders with detailed inventory management
              </p>
              <Button 
                onClick={() => onViewChange('work-orders')}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium hover:from-teal-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <Factory className="w-5 h-5 mr-2" />
                View Work Orders
              </Button>
            </CardContent>
          </Card>

          {/* Invoices Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-purple-500">32</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Invoices</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Generate and manage invoices with GST calculations and client billing
              </p>
              <Button 
                onClick={() => onViewChange('invoices')}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-pink-500 hover:to-pink-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <IndianRupee className="w-5 h-5 mr-2" />
                View Invoices
              </Button>
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card className="rounded-xl text-card-foreground dashboard-card bg-white shadow-lg border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <ChartColumn className="w-7 h-7 text-white" />
                </div>
                <span className="text-3xl font-bold text-emerald-500">12</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Access comprehensive analytics and insights for business intelligence
              </p>
              <Button 
                onClick={() => onViewChange('reports')}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-cyan-500 hover:to-cyan-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                <ChartColumn className="w-5 h-5 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-xl text-card-foreground bg-white shadow-md border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-lg">Add Recipe</h4>
                <p className="text-sm text-slate-600">Create a new production recipe with detailed instructions</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl text-card-foreground bg-white shadow-md border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-lg">New Work Order</h4>
                <p className="text-sm text-slate-600">Start a production work order with product specifications</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl text-card-foreground bg-white shadow-md border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <ChartColumn className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-lg">View Reports</h4>
                <p className="text-sm text-slate-600">Access analytics and insights for business decisions</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl text-card-foreground bg-white shadow-md border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-6">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 text-lg">Add Client</h4>
                <p className="text-sm text-slate-600">Register a new client with complete business details</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
}
