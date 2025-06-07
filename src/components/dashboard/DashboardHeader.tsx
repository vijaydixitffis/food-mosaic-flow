
import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  profile: any;
  onSignOut: () => void;
}

export function DashboardHeader({ profile, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <img 
              src="/fnbicon.png" 
              alt="FoodMosaic Logo" 
              className="h-20 w-20 object-contain"
              style={{ width: '80px', height: '80px' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FoodMosaic</h1>
              <p className="text-sm text-gray-600">Execute recipes and ship well</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{profile?.username}</p>
            <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
          </div>
          <Button onClick={onSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
