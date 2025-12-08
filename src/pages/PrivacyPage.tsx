import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export const PrivacyPage: React.FC = () => {
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

      {/* Privacy Content */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-h1 text-text-primary mb-4">Privacy Policy</h1>
          <p className="text-body text-text-muted">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className="space-y-8">
            <div>
              <h2 className="text-h2 text-text-primary mb-4">Information We Collect</h2>
              <p className="text-body text-text-muted mb-4">
                We collect information that you provide directly to us, such as when you create an account, 
                update your profile, or use our services.
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-text-muted">
                <li>Account information (email, name, team details)</li>
                <li>Content you create (changelog posts, settings)</li>
                <li>Usage data and analytics</li>
                <li>Device and browser information</li>
              </ul>
            </div>

            <div>
              <h2 className="text-h2 text-text-primary mb-4">How We Use Your Information</h2>
              <p className="text-body text-text-muted mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-text-muted">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-h2 text-text-primary mb-4">Data Security</h2>
              <p className="text-body text-text-muted">
                We implement appropriate security measures to protect your personal information. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-h2 text-text-primary mb-4">Your Rights</h2>
              <p className="text-body text-text-muted mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-body text-text-muted">
                <li>Access and update your personal information</li>
                <li>Delete your account and data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </div>

            <div>
              <h2 className="text-h2 text-text-primary mb-4">Contact Us</h2>
              <p className="text-body text-text-muted">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@scotty.app" className="text-accent hover:text-accent-hover">
                  privacy@scotty.app
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

