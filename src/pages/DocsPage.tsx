import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Code, Settings, Bot, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

      {/* Docs Content */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-h1 text-text-primary mb-4">Documentation</h1>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            Learn how to get the most out of Scotty with our guides and API documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-accent" />
              </div>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">
                Learn the basics of creating your first changelog post and setting up your workspace.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <Code size={24} className="text-accent" />
              </div>
              <CardTitle>API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">
                Integrate Scotty into your workflow with our REST API and webhooks.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <Settings size={24} className="text-accent" />
              </div>
              <CardTitle>Widget Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">
                Embed the changelog widget on your website with just a few lines of code.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <Bot size={24} className="text-accent" />
              </div>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">
                Configure and use the AI assistant to help draft and refine your updates.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <BarChart3 size={24} className="text-accent" />
              </div>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted">
                Understand your audience with detailed analytics and engagement metrics.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

