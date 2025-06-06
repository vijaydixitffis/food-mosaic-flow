
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
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">FoodMosaic</h1>
            <p className="text-sm text-gray-600">Enterprise Resource Planning</p>
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
