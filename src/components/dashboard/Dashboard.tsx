
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar currentView={currentView} onViewChange={handleViewChange} />
        <SidebarInset>
          <DashboardHeader profile={profile} onSignOut={handleSignOut} />
          <main className="flex-1 p-6">
            <DashboardContent currentView={currentView} onViewChange={handleViewChange} />
          </main>
          <DashboardFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
