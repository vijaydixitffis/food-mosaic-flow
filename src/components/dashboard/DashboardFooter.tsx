import React from 'react';

export function DashboardFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center space-x-4">
          <span>© 2024 FoodMosaic. All rights reserved.</span>
          <span className="text-slate-400">•</span>
          <span>Version 1.0.0</span>
        </div>
        <div className="hidden sm:block">
          <span>Powered by Future Focus IT Solutions</span>
        </div>
      </div>
    </footer>
  );
}
