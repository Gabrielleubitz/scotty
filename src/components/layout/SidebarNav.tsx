import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Bot, BarChart3, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarNavProps {
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: 'Changelog', icon: <BookOpen size={20} />, path: '/admin' },
    { label: 'AI Assistant', icon: <Bot size={20} />, path: '/admin/ai' },
    { label: 'Insights', icon: <BarChart3 size={20} />, path: '/admin/insights' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const isActive = (path: string) => {
    // Only highlight Changelog when on /admin (exact match, not sub-routes)
    if (path === '/admin') {
      return location.pathname === '/admin' || (location.pathname.startsWith('/admin') && !location.pathname.includes('/god') && !location.pathname.includes('/posts') && !location.pathname.includes('/ai') && !location.pathname.includes('/insights'));
    }
    // For other paths, check exact match
    return location.pathname === path;
  };

  return (
    <div className={cn('flex flex-col h-full bg-bg-surface border-r border-border', className)}>
      {/* Logo */}
      <div className="flex items-center space-x-2 px-6 py-6 border-b border-border">
        <Logo size={24} />
        <span className="text-h3 text-text-primary font-semibold">Scotty</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-input text-body font-medium transition-colors',
                active
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-primary hover:bg-[#111827]'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

