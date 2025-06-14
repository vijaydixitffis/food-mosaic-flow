
import React, { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/AppSidebar';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [currentView, setCurrentView] = useState('clients');

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
