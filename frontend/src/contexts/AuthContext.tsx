'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  name?: string;
  auth_provider?: 'email' | 'google';
  picture?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (returnUrl?: string, pendingDownload?: string, pendingFavorite?: string) => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies for session
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if authenticated flag is present and true, or if data exists
        if (data.authenticated && data.success && data.data) {
          setUser({
            id: parseInt(data.data.id),
            email: data.data.email || '',
            name: data.data.name,
            auth_provider: data.data.auth_provider || 'email',
            picture: data.data.picture || null,
          });
          setError(null);
        } else {
          // Not authenticated (authenticated: false or no data)
          setUser(null);
          setError(null);
        }
      } else {
        // Only log actual errors (not 200 with authenticated: false)
        console.error('Auth check failed:', response.status, response.statusText);
        setUser(null);
      }
    } catch (err) {
      // Only log network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('Network error checking auth status:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback((returnUrl?: string, pendingDownload?: string, pendingFavorite?: string) => {
    // Build OAuth URL with return URL and pending download/favorite info
    const url = new URL('/api/auth/google', window.location.origin);
    if (returnUrl) {
      url.searchParams.set('returnUrl', returnUrl);
    }
    if (pendingDownload) {
      url.searchParams.set('download', pendingDownload);
    }
    if (pendingFavorite) {
      url.searchParams.set('favorite', pendingFavorite);
    }
    // Redirect to Google OAuth
    window.location.href = url.toString();
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Sign out from backend session
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check authentication status on mount and after OAuth callback
  useEffect(() => {
    // Check for OAuth callback indicators in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || oauthError;
    
    if (oauthError) {
      setError('Authentication failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      checkAuthStatus();
    } else if (hasOAuthParams) {
      // Only do delayed check if we detect OAuth callback params
      // Clean up OAuth params first
      window.history.replaceState({}, '', window.location.pathname);
      // Check auth status after a short delay to allow session to be established
      const timer = setTimeout(() => {
        checkAuthStatus();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Normal mount - just check once
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
