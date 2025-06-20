import React from 'react';
import { IngredientsPage } from '@/components/ingredients/IngredientsPage';
import { CompoundsPage } from '@/components/compounds/CompoundsPage';
import { ProductsPage } from '@/components/products/ProductsPage';
import { RecipesPage } from '@/components/recipes/RecipesPage';
import { WorkOrdersPage } from '@/components/work-orders/WorkOrdersPage';
import { ClientsPage } from '@/components/clients/ClientsPage';
import { OrdersPage } from '@/components/orders/OrdersPage';

interface DashboardContentProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardContent({ currentView, onViewChange }: DashboardContentProps) {
  console.log('DashboardContent rendering view:', currentView);

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Welcome to FoodMosaic</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your comprehensive food production management system. Manage ingredients, compounds, 
                products, recipes, work orders, and more from this central dashboard.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('ingredients')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Ingredients</h3>
                <p className="text-muted-foreground">Manage your raw ingredients and their properties</p>
              </div>
              
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('compounds')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Compounds</h3>
                <p className="text-muted-foreground">Create and manage ingredient compounds</p>
              </div>
              
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('products')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Products</h3>
                <p className="text-muted-foreground">Manage your final products and compositions</p>
              </div>
              
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('recipes')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Recipes</h3>
                <p className="text-muted-foreground">Create and manage production recipes</p>
              </div>
              
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('clients')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Clients</h3>
                <p className="text-muted-foreground">Manage your clients and their information</p>
              </div>
              
              <div 
                className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                onClick={() => onViewChange('work-orders')}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">Work Orders</h3>
                <p className="text-muted-foreground">Create and track production work orders</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-foreground mb-2">Reports</h3>
                <p className="text-muted-foreground">View analytics and generate reports</p>
              </div>
            </div>
          </div>
        );
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
      case 'work-orders':
        return <WorkOrdersPage />;
      case 'orders':
        return <OrdersPage />;
      case 'pricing':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Pricing Management</h2>
            <p className="text-gray-600">Pricing features coming soon...</p>
          </div>
        );
      case 'invoices':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Invoice Management</h2>
            <p className="text-gray-600">Invoice features coming soon...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">Reports features coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-muted/20">
      {renderContent()}
    </div>
  );
}
