import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../lib/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Initialize with current user
    setUser(authService.getCurrentUser());
    setLoading(false);

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    return authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    return authService.signUp(email, password, name);
  };

  const signInWithGoogle = async () => {
    return authService.signInWithGoogle();
  };

  const signOut = async () => {
    return authService.signOut();
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
};