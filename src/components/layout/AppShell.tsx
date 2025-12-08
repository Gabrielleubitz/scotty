import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { cn } from '../../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showSidebar = true,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-page flex">
      {/* Sidebar - Desktop */}
      {showSidebar && (
        <>
          <div className="hidden md:flex md:w-64 md:flex-shrink-0">
            <SidebarNav />
          </div>

          {/* Sidebar - Mobile */}
          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 z-50 md:hidden">
                <SidebarNav />
              </div>
            </>
          )}
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30">
          <TopBar />
          {showSidebar && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden absolute top-4 left-4 p-2 rounded-input bg-bg-card border border-border text-text-primary hover:bg-[#111827] z-50"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

