import React, { useEffect, useState } from 'react';
import { Tag } from './ui/Tag';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export const InlineChangelogDemo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const updates = [
    {
      date: '2025-02-15',
      title: 'Added multi-language support',
      tag: 'New',
      tagVariant: 'accent' as const,
    },
    {
      date: '2025-02-10',
      title: 'Improved release scheduling',
      tag: 'Improvement',
      tagVariant: 'success' as const,
    },
    {
      date: '2025-02-05',
      title: 'Fixed broken links in help center',
      tag: 'Fix',
      tagVariant: 'warning' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Central changelog</CardTitle>
        <p className="text-caption text-text-muted mt-1">
          One place for every product update.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {updates.map((update, idx) => (
            <div
              key={idx}
              className="p-3 rounded-input bg-bg-cardAlt border border-border hover:bg-[#111827] transition-colors flex items-start justify-between gap-4"
              style={{
                animationDelay: `${idx * 0.15}s`,
                animation: isVisible ? 'fadeInUp 0.5s ease-out forwards' : 'none',
                opacity: isVisible ? 1 : 0,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                  <span className="text-caption text-text-muted font-mono whitespace-nowrap">
                    {update.date}
                  </span>
                  <Tag size="sm" variant={update.tagVariant}>
                    {update.tag}
                  </Tag>
                </div>
                <h4 className="text-body font-semibold text-text-primary">
                  {update.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
};

