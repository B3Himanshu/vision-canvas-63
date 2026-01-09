'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GoogleSignInButton } from './GoogleSignInButton';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  returnUrl?: string;
  pendingDownload?: string;
  pendingFavorite?: string; // Image ID for pending favorite action
}

export function SignInModal({
  open,
  onOpenChange,
  title = 'Sign in to download',
  description = 'Please sign in with your Google account to download images.',
  returnUrl,
  pendingDownload,
  pendingFavorite,
}: SignInModalProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignInSuccess = () => {
    setIsSigningIn(false);
    onOpenChange(false);
  };

  const handleSignInError = () => {
    setIsSigningIn(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <GoogleSignInButton
            className="w-full"
            size="lg"
            onSuccess={handleSignInSuccess}
            onError={handleSignInError}
            returnUrl={returnUrl}
            pendingDownload={pendingDownload}
            pendingFavorite={pendingFavorite}
          />
          
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-center text-muted-foreground">
          By signing in, you agree to our terms of service and privacy policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}
