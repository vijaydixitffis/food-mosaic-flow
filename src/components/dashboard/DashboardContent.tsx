
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Package, Users, BarChart3, ShoppingCart, ChefHat, DollarSign } from 'lucide-react';
import { IngredientsPage } from '@/components/ingredients/IngredientsPage';

interface DashboardContentProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function DashboardContent({ currentView, onViewChange }: DashboardContentProps) {
  const { isAdmin } = useAuth();

  console.log('DashboardContent rendered with currentView:', currentView);

  if (currentView === 'ingredients') {
    console.log('Rendering IngredientsPage component');
    return <IngredientsPage />;
  }

  console.log('Rendering default home view');

  // Default home view
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to your FoodMosaic control panel</p>
        <p className="text-sm text-blue-600 mt-2">Current view: {currentView}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <CardDescription>Active ingredients</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <CardDescription>Total products</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <CardDescription>Active recipes</CardDescription>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,345</div>
              <CardDescription>This month</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => {
              console.log('Clicking Add Ingredient button, changing view to ingredients');
              onViewChange('ingredients');
            }}
          >
            <Package className="w-6 h-6 mb-2" />
            Add Ingredient
          </Button>
          
          <Button variant="outline" className="h-20 flex-col">
            <ShoppingCart className="w-6 h-6 mb-2" />
            Create Product
          </Button>
          
          <Button variant="outline" className="h-20 flex-col">
            <ChefHat className="w-6 h-6 mb-2" />
            New Recipe
          </Button>
          
          {isAdmin && (
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              View Reports
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
