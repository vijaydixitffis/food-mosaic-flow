import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-orange-50 to-red-50">
      <Card className="w-full max-w-md mx-4 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">404</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <p className="text-slate-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-gradient-to-r from-green-500 to-orange-500 hover:from-green-600 hover:to-orange-600">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
