import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const services = [
    { name: 'API', status: 'operational', description: 'All systems operational' },
    { name: 'Dashboard', status: 'operational', description: 'All systems operational' },
    { name: 'Widget', status: 'operational', description: 'All systems operational' },
    { name: 'AI Assistant', status: 'operational', description: 'All systems operational' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={20} className="text-status-success" />;
      case 'degraded':
        return <AlertCircle size={20} className="text-status-warning" />;
      case 'down':
        return <XCircle size={20} className="text-status-error" />;
      default:
        return <AlertCircle size={20} className="text-text-muted" />;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2">
            <Logo size={24} />
            <span className="text-h3 text-text-primary font-semibold">Scotty</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={() => user ? navigate('/admin') : navigate('/')}>
              {user ? 'Dashboard' : 'Home'}
            </Button>
          </div>
        </div>
      </header>

      {/* Status Content */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-h1 text-text-primary mb-4">System Status</h1>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            Real-time status of all Scotty services and infrastructure.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-3">
              {getStatusIcon('operational')}
              <div>
                <CardTitle>All Systems Operational</CardTitle>
                <p className="text-body text-text-muted mt-1">All services are running normally.</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {services.map((service) => (
            <Card key={service.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="text-body font-semibold text-text-primary">{service.name}</h3>
                    <p className="text-caption text-text-muted">{service.description}</p>
                  </div>
                </div>
                <Tag variant={getStatusVariant(service.status)} size="sm">
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </Tag>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

