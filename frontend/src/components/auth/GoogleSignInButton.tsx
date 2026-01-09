'use client';

import { useAuth } from '@/hooks/useAuth';

interface GoogleSignInButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  returnUrl?: string;
  pendingDownload?: string;
  pendingFavorite?: string; // Image ID for pending favorite action
}

export function GoogleSignInButton({
  className = '',
  size = 'default',
  onSuccess,
  onError,
  returnUrl,
  pendingDownload,
  pendingFavorite,
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, loading } = useAuth();

  const handleSignIn = () => {
    try {
      signInWithGoogle(returnUrl, pendingDownload, pendingFavorite);
      // Note: onSuccess won't be called immediately since we're redirecting
      // It will be called after OAuth callback completes
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      onError?.(errorMessage);
    }
  };

  // Size-based padding and text
  const sizeClasses: Record<string, string> = {
    sm: 'h-9 px-4 text-sm',
    default: 'h-11 px-6 text-base',
    lg: 'h-12 px-8 text-base',
    icon: 'h-11 px-6 text-base', // Fallback for icon size
  };

  const iconSizes: Record<string, string> = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-5 w-5',
    icon: 'h-5 w-5', // Fallback for icon size
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${className}
        w-full
        bg-white
        border
        border-gray-300
        rounded-lg
        font-medium
        text-gray-700
        shadow-sm
        hover:shadow-md
        hover:bg-gray-50
        active:bg-gray-100
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition-all
        duration-200
        flex
        items-center
        justify-center
        gap-3
        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        focus:ring-blue-500
      `}
    >
      {/* Official Google Logo */}
      <svg 
        className={iconSizes[size]} 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="text-gray-700 font-medium">
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </span>
    </button>
  );
}
