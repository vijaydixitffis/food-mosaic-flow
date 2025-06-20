import React from 'react';

export function DashboardFooter() {
  return (
    <footer className="bg-gray-50 border-t px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          © 2024 FoodMosaic. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Version 1.0.0</span>
          <span className="text-xs text-gray-500">Powered by Future Focus IT Solutions</span>
        </div>
      </div>
    </footer>
  );
}
