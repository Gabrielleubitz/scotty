import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TeamSettings } from '../components/TeamSettings';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell showSidebar={true}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>
        </div>
        
        <div>
          <h1 className="text-h1 text-text-primary mb-2">Team Settings</h1>
          <p className="text-body text-text-muted">Manage your team, billing, and preferences.</p>
        </div>
        
        <TeamSettings 
          isOpen={true} 
          onClose={() => navigate('/')} 
        />
      </div>
    </AppShell>
  );
};

