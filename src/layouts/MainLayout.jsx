import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * MainLayout – The standardized shell for all internal SaaS pages
 */
export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen transition-colors duration-500">
            {/* Overlay backdrop for mobile & Tablets */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar with state control */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col overflow-x-hidden">
                {/* Topbar with mobile menu toggle */}
                <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                {/* Main Content Area */}
                <main className="flex-1 p-4 md:p-8">
                    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
