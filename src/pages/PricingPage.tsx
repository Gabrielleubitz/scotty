import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Logo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from '../components/AuthModal';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

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
            <Button variant="secondary" onClick={() => user ? navigate('/admin') : setIsAuthModalOpen(true)}>
              {user ? 'Dashboard' : 'Log in'}
            </Button>
            {!user && (
              <Button onClick={() => setIsAuthModalOpen(true)}>
                Get started
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-h1 text-text-primary mb-4">Simple, transparent pricing</h1>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            Choose the plan that fits your team. All plans include core features with no hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Basic Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h2">Basic</CardTitle>
              <div className="mt-4">
                <span className="text-h1 text-text-primary">Free</span>
                <span className="text-body text-text-muted ml-2">forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Up to 2 contributors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Unlimited changelog posts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Basic analytics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Widget embedding</span>
                </li>
              </ul>
              <Button variant="secondary" className="w-full" onClick={() => setIsAuthModalOpen(true)}>
                Get started
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-accent/50 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-accent text-text-primary px-4 py-1 rounded-pill text-caption font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-h2">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-h1 text-text-primary">$29</span>
                <span className="text-body text-text-muted ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Up to 10 contributors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Everything in Basic</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Advanced analytics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">AI Assistant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check size={20} className="text-status-success mt-0.5 flex-shrink-0" />
                  <span className="text-body text-text-muted">Priority support</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => setIsAuthModalOpen(true)}>
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

