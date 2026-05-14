import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * MainLayout – The standardized shell for all internal SaaS pages with premium mesh background
 */
export default function MainLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-mesh transition-colors duration-500">
            {/* Overlay backdrop for mobile & Tablets */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden transition-opacity duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar with state control */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col h-[100dvh] overflow-hidden">
                {/* Topbar with mobile menu toggle */}
                <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                {/* Main Content Area */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="mx-auto max-w-[1700px] animate-in fade-in duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
