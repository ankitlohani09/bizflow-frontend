import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * MainLayout provides the structural wrapper for the entire dashboard
 * Including responsive sidebar and sticky topbar
 */
export default function MainLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      {/* Sidebar - fixed and hidden on mobile if needed, but here standard desktop sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Topbar title={title} />
        
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* Optional Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} BizFlow Enterprise. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
