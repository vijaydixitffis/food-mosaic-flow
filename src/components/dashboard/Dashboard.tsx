
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

  console.log('Dashboard component rendered, currentView:', currentView);
  console.log('Profile:', profile);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewChange = (view: string) => {
    console.log('Dashboard handleViewChange called with:', view);
    setCurrentView(view);
  };

  if (!profile) {
    console.log('No profile found, this should redirect to login');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

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
