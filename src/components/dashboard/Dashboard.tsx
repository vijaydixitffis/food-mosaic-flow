
import React from 'react';
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader profile={profile} onSignOut={handleSignOut} />
          <main className="flex-1 p-6">
            <DashboardContent />
          </main>
          <DashboardFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
