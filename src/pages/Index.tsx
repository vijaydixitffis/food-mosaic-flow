
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";

const Index = () => {
  const { user, loading } = useAuth();

  console.log('Index page rendered');
  console.log('User:', user);
  console.log('Is loading:', loading);

  if (loading) {
    console.log('Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we check your authentication status.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, showing login form');
    return <LoginForm />;
  }

  console.log('User found, showing dashboard');
  return <Dashboard />;
};

export default Index;
