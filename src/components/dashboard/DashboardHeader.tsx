import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, ChevronRight, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  profile: any;
  onSignOut: () => void;
  onToggleSidebar?: () => void;
  currentView?: string;
}

export function DashboardHeader({ profile, onSignOut, onToggleSidebar, currentView }: DashboardHeaderProps) {
  const getViewTitle = (view: string) => {
    switch (view) {
      case 'home': return 'Home';
      case 'ingredients': return 'Ingredients';
      case 'compounds': return 'Compounds';
      case 'products': return 'Products';
      case 'recipes': return 'Recipes';
      case 'clients': return 'Clients';
      case 'orders': return 'Orders';
      case 'work-orders': return 'Work Orders';
      case 'invoices': return 'Invoices';
      case 'reports': return 'Reports';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={onToggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-slate-500">Dashboard</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-medium">{getViewTitle(currentView || 'home')}</span>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600">
            <span>{profile?.username || 'admin'}</span>
            <span className="text-slate-400">•</span>
            <span>{profile?.role === 'admin' ? 'Admin' : 'Staff'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
