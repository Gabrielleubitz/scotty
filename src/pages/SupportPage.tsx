import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export const SupportPage: React.FC = () => {
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

      {/* Support Content */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-h1 text-text-primary mb-4">Get Support</h1>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            We're here to help. Choose the best way to reach us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <Mail size={24} className="text-accent" />
              </div>
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted mb-4">
                Send us an email and we'll get back to you within 24 hours.
              </p>
              <a href="mailto:support@scotty.app" className="text-accent hover:text-accent-hover">
                support@scotty.app
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-accent/30 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-accent" />
              </div>
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body text-text-muted mb-4">
                Chat with our team in real-time for immediate assistance.
              </p>
              <Button variant="secondary" size="sm">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-accent/20 rounded-card flex items-center justify-center mb-4">
              <HelpCircle size={24} className="text-accent" />
            </div>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-body font-semibold text-text-primary mb-2">How do I create my first post?</h3>
                <p className="text-body text-text-muted">
                  After signing up, go to your dashboard and click "Create New Update". Fill in the details and publish.
                </p>
              </div>
              <div>
                <h3 className="text-body font-semibold text-text-primary mb-2">Can I customize the widget?</h3>
                <p className="text-body text-text-muted">
                  Yes! You can customize colors, size, and behavior in your widget settings.
                </p>
              </div>
              <div>
                <h3 className="text-body font-semibold text-text-primary mb-2">How does the AI assistant work?</h3>
                <p className="text-body text-text-muted">
                  The AI assistant helps you draft and refine changelog posts. Configure it in your AI settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

