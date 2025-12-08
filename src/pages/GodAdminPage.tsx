import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GodAdminPanel } from '../components/GodAdminPanel';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

export const GodAdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Admin Dashboard
          </Button>
        </div>
        <GodAdminPanel />
      </div>
    </AppShell>
  );
};

