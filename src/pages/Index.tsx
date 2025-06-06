
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';
import Dashboard from '@/components/dashboard/Dashboard';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [shouldShowDashboard, setShouldShowDashboard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !shouldShowDashboard) {
    return (
      <LoginForm onLoginSuccess={() => setShouldShowDashboard(true)} />
    );
  }

  return <Dashboard />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
