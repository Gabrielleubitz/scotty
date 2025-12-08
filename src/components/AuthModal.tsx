import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../hooks/useAuth';
import { Chrome, Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-h2 text-text-primary mb-2">
            {isSignUp ? 'Create your account' : 'Log in to Scotty'}
          </h2>
          <p className="text-body text-text-muted">
            {isSignUp ? 'Sign up to get started' : 'Access your workspaces and changelogs.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <Input
              id="name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          )}
          
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          
          <div className="space-y-1">
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-caption text-text-muted hover:text-text-primary transition-colors flex items-center space-x-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <>
                    <EyeOff size={14} />
                    <span>Hide password</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} />
                    <span>Show password</span>
                  </>
                )}
              </button>
            </div>
            {isSignUp && (
              <p className="text-caption text-text-muted mt-1">
                Must be at least 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-input p-3 flex items-start space-x-2">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-body text-status-error flex-1">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full"
            size="lg"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="px-3 bg-bg-card text-text-muted font-medium">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            loading={loading}
            className="w-full"
            size="lg"
          >
            <Chrome size={18} className="mr-2" />
            Sign in with Google
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setPassword('');
              }}
              className="text-body text-text-muted hover:text-text-primary transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="text-accent font-semibold">Sign in</span>
                </>
              ) : (
                <>
                  Don't have an account? <span className="text-accent font-semibold">Get access</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};