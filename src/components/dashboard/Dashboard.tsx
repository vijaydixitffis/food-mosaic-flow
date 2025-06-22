import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardFooter } from './DashboardFooter';
import { DashboardContent } from './DashboardContent';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('home');
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto shadow-xl min-h-screen" style={{
        background: 'linear-gradient(to bottom right, rgba(240, 253, 244, 0.3), rgba(255, 247, 237, 0.3), rgba(254, 242, 242, 0.3))'
      }}>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <div className="fixed lg:static inset-y-0 left-0 z-50 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
              <AppSidebar currentView={currentView} onViewChange={handleViewChange} profile={profile} />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <DashboardHeader 
                profile={profile} 
                onSignOut={handleSignOut}
                currentView={currentView}
              />
              <main className="flex-1 overflow-y-auto">
                <DashboardContent currentView={currentView} onViewChange={handleViewChange} />
              </main>
              <DashboardFooter />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default Dashboard;
