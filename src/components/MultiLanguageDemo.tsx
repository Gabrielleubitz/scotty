import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';

export const MultiLanguageDemo: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'EN' | 'ES' | 'FR'>('EN');

  const translations = {
    EN: 'New reporting dashboard',
    ES: 'Nuevo panel de informes',
    FR: 'Nouveau tableau de bord de rapports',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-language updates</CardTitle>
        <p className="text-caption text-text-muted mt-1">
          Show the same changelog in different languages.
        </p>
      </CardHeader>
      <CardContent>
        {/* Language selector */}
        <div className="flex gap-2 mb-4">
          {(['EN', 'ES', 'FR'] as const).map((lang) => (
            <Button
              key={lang}
              variant={selectedLang === lang ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedLang(lang)}
              className="rounded-pill"
            >
              {lang}
            </Button>
          ))}
        </div>

        {/* Translated title */}
        <div className="p-4 rounded-input bg-bg-cardAlt border border-border">
          <p className="text-body font-semibold text-text-primary">
            {translations[selectedLang]}
          </p>
          <p className="text-caption text-text-muted mt-2">
            Track product usage with clearer charts.
          </p>
        </div>

        <p className="text-caption text-text-muted mt-4 text-center">
          Scotty powers the updates your users actually see.
        </p>
      </CardContent>
    </Card>
  );
};

