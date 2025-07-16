
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import Dashboard from "@/components/dashboard/Dashboard";

const Index = () => {
  const { user, loading, error, retryAuth } = useAuth();

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h2>
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={retryAuth}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-orange-500 text-white rounded shadow hover:from-green-600 hover:to-orange-600 transition-all"
          >
            Retry
          </button>
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
