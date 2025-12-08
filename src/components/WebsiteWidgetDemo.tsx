import React, { useEffect, useState } from 'react';
import { Tag } from './ui/Tag';

export const WebsiteWidgetDemo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const updates = [
    {
      title: 'New reporting dashboard',
      subtitle: 'Track product usage with clearer charts.',
      tag: 'New',
      tagVariant: 'accent' as const,
    },
    {
      title: 'Faster login for SSO users',
      subtitle: 'Improved SSO flow for enterprise domains.',
      tag: 'Improvement',
      tagVariant: 'success' as const,
    },
    {
      title: 'Bug fixes in notifications',
      subtitle: 'More reliable email and in-app alerts.',
      tag: 'Fix',
      tagVariant: 'warning' as const,
    },
  ];

  return (
    <div className="relative w-full">
      {/* Browser frame */}
      <div className="bg-bg-surfaceAlt border-b border-border px-4 py-3 flex items-center justify-between rounded-t-card">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-status-error/60"></div>
            <div className="w-3 h-3 rounded-full bg-status-warning/60"></div>
            <div className="w-3 h-3 rounded-full bg-status-success/60"></div>
          </div>
          <span className="text-caption text-text-muted ml-3">yourapp.com</span>
        </div>
        <span className="text-caption text-text-muted bg-bg-cardAlt px-2 py-0.5 rounded-pill">
          Live site preview
        </span>
      </div>

      {/* Main content area */}
      <div className="bg-bg-card border-x border-b border-border rounded-b-card overflow-hidden relative">
        <div className="flex h-[400px]">
          {/* Left side - Fake website */}
          <div className="flex-1 bg-bg-surfaceAlt p-6 space-y-4">
            {/* Hero block */}
            <div className="h-24 bg-bg-card rounded-input border border-border"></div>
            
            {/* Section bars */}
            <div className="space-y-3">
              <div className="h-12 bg-bg-card rounded-input border border-border"></div>
              <div className="h-12 bg-bg-card rounded-input border border-border"></div>
              <div className="h-12 bg-bg-card rounded-input border border-border"></div>
            </div>
          </div>

          {/* Right side - Slide-out panel */}
          <div
            className={`w-80 bg-bg-card border-l border-border transition-all duration-500 ease-out ${
              isVisible
                ? 'translate-x-0 opacity-100'
                : 'translate-x-5 opacity-0'
            }`}
            style={{
              boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Panel header */}
            <div className="bg-bg-surfaceAlt border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="text-body font-semibold text-text-primary">What's new</h3>
              <Tag size="sm" variant="accent">Powered by Scotty</Tag>
            </div>

            {/* Updates list */}
            <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(400px - 60px)' }}>
              {updates.map((update, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-input bg-bg-cardAlt border border-border hover:border-accent/30 transition-colors"
                  style={{
                    animationDelay: `${idx * 0.1}s`,
                    animation: isVisible ? 'fadeIn 0.4s ease-out forwards' : 'none',
                    opacity: isVisible ? 1 : 0,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Tag size="sm" variant={update.tagVariant}>
                      {update.tag}
                    </Tag>
                  </div>
                  <h4 className="text-body font-semibold text-text-primary mb-1">
                    {update.title}
                  </h4>
                  <p className="text-caption text-text-muted">
                    {update.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-bg-surfaceAlt border-t border-border text-center">
          <p className="text-caption text-text-muted">
            Embedded on your site. Powered by Scotty.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

