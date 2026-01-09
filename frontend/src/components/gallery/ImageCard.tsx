'use client';

import { useState, useMemo, useRef } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Eye, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BlurHashImage } from '@/components/ui/blurhash-image';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/auth/SignInModal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ImageCardProps {
  image: {
    id: number;
    hashId?: string; // Secure hash ID for URLs (e.g., "a3xK9m")
    url?: string; // For backward compatibility
    thumbnailUrl?: string; // API returns this
    imageUrl?: string; // API returns this
    blurhash?: string | null; // BlurHash for instant preview
    title: string;
    author: string;
    downloads: number;
    width?: number;
    height?: number;
  };
  onClick: () => void;
}

// Memoize ImageCard to prevent unnecessary re-renders when modal opens/closes
const ImageCard = React.memo(({ image, onClick }: ImageCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasCheckedFavoriteRef = useRef(false); // Track if we've already checked favorite status for this image
  const currentImageIdRef = useRef<number | null>(null); // Track current image ID
  
  // Memoize thumbnail URL to prevent unnecessary re-renders
  const thumbnailUrl = useMemo(() => {
    return image.thumbnailUrl || image.url || `/api/images/${image.hashId || image.id}/thumbnail`;
  }, [image.thumbnailUrl, image.url, image.id, image.hashId]);

  // Handle image click - navigate to dedicated image page
  const handleImageClick = () => {
    if (onClick) {
      onClick(); // Call original onClick if provided (for backward compatibility)
    } else {
      // Navigate to dedicated image page using hash ID (secure) or numeric ID (fallback)
      const imageId = image.hashId || image.id;
      router.push(`/image/${imageId}`);
    }
  };

  // Check if image is favorited on mount (silently in background)
  // Only check once per image ID to prevent duplicate API calls
  React.useEffect(() => {
    // Reset check flag ONLY if image ID actually changed (not on every render)
    if (currentImageIdRef.current !== image.id) {
      hasCheckedFavoriteRef.current = false;
      currentImageIdRef.current = image.id;
    }

    // Only check if we haven't checked this image yet and user is authenticated
    // Don't check if we've already checked this exact image ID
    if (isAuthenticated && user && !hasCheckedFavoriteRef.current && currentImageIdRef.current === image.id) {
      hasCheckedFavoriteRef.current = true;
      checkFavoriteStatus();
    } else if (!isAuthenticated || !user) {
      // Only reset if authentication state changed, not on every render
      if (hasCheckedFavoriteRef.current) {
        setIsLiked(false);
        hasCheckedFavoriteRef.current = false; // Reset so we check again when authenticated
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, image.id]); // Only depend on these values, not on user object

  const checkFavoriteStatus = async () => {
    console.log('[ImageCard] checkFavoriteStatus: Checking favorite status', { imageId: image.id });
    try {
      const response = await fetch(`/api/favorites/check?imageId=${image.id}`, {
        credentials: 'include',
      });
      console.log('[ImageCard] checkFavoriteStatus: Response', {
        status: response.status,
        ok: response.ok,
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[ImageCard] checkFavoriteStatus: Favorite status', {
          isFavorited: data.isFavorited,
        });
        setIsLiked(data.isFavorited || false);
      } else {
        console.warn('[ImageCard] checkFavoriteStatus: Failed to check status', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      console.error('[ImageCard] checkFavoriteStatus: Error', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    console.log('[ImageCard] handleLike called', {
      imageId: image.id,
      hashId: (image as any)?.hashId,
      isLiked,
      isAuthenticated,
      title: image.title,
    });
    
    if (!isAuthenticated) {
      console.log('[ImageCard] handleLike: User not authenticated, opening sign-in modal');
      setPendingFavorite(true);
      setShowSignInModal(true);
      return;
    }

    // Optimistically update UI immediately (no loading state)
    const previousLikedState = isLiked;
    console.log('[ImageCard] handleLike: Optimistically updating UI', {
      previousLikedState,
      newLikedState: !isLiked,
    });
    setIsLiked(!isLiked);

    try {
      if (previousLikedState) {
        // Remove from favorites
        console.log('[ImageCard] handleLike: Removing from favorites', { imageId: image.id });
        const response = await fetch(`/api/favorites?imageId=${image.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        console.log('[ImageCard] handleLike: DELETE response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => null);
          console.log('[ImageCard] handleLike: Successfully removed from favorites', responseData);
          toast.success('Removed from favorites', {
            description: `Image "${image.title}" has been removed from your favorites.`,
          });
          
          // Invalidate favorites query to update the favorites page
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
        } else {
          // Revert on error
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[ImageCard] handleLike: Failed to remove from favorites', {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          setIsLiked(previousLikedState);
          toast.error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        console.log('[ImageCard] handleLike: Adding to favorites', { imageId: image.id });
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageId: image.id }),
        });
        
        console.log('[ImageCard] handleLike: POST response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => null);
          console.log('[ImageCard] handleLike: Successfully added to favorites', responseData);
          toast.success('Added to favorites', {
            description: `Image "${image.title}" has been added to your favorites.`,
          });
          
          // Invalidate favorites query to update the favorites page
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
        } else {
          // Revert on error
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[ImageCard] handleLike: Failed to add to favorites', {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          setIsLiked(previousLikedState);
          toast.error('Failed to add to favorites');
        }
      }
    } catch (error) {
      // Revert on error
      console.error('[ImageCard] handleLike: Exception occurred', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        previousLikedState,
      });
      setIsLiked(previousLikedState);
      toast.error('Failed to update favorite', {
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setShowSignInModal(true);
      return;
    }

    try {
      const imageUrl = image.imageUrl || image.url || `/api/images/${image.id}/file`;
      const response = await fetch(imageUrl, {
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowSignInModal(true);
          return;
        }
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setShowSignInModal(true);
    }
  };

  return (
    <motion.div
      className="group relative rounded-2xl overflow-hidden cursor-pointer mb-4 bg-secondary/30"
      style={{ breakInside: 'avoid' }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={handleImageClick}
    >
      {/* Image with BlurHash placeholder - Instant preview + fast WebP loading */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '600 / ' + (image.height || 400) }}>
        <BlurHashImage
          src={thumbnailUrl}
          blurhash={image.blurhash}
          alt={image.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          unoptimized={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Top Actions - Always slightly visible, more on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
            isSaved 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background/60 text-foreground hover:bg-background/80'
          }`}
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </motion.button>
        <motion.button
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
            isLiked 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-background/60 text-foreground hover:bg-background/80'
          }`}
          onClick={handleLike}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Title & Author */}
        <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-1">
          {image.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${image.author}`}
                alt={image.author}
                className="w-full h-full"
              />
            </div>
            <span className="text-muted-foreground text-xs">@{image.author}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {Math.floor(image.downloads * 1.5).toLocaleString()}
            </span>
            <motion.button
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handleDownload}
              whileTap={{ scale: 0.9 }}
            >
              <Download className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Stats Badge */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/60 backdrop-blur-md text-xs text-foreground">
          <Download className="h-3 w-3" />
          {image.downloads.toLocaleString()}
        </div>
      </div>

      {/* Sign-In Modal */}
      <SignInModal
        open={showSignInModal}
        onOpenChange={(open) => {
          setShowSignInModal(open);
          if (!open) {
            setPendingFavorite(false);
          }
        }}
        title={pendingFavorite ? "Sign in to favorite" : "Sign in to download"}
        description={pendingFavorite ? "Please sign in with your Google account to favorite images." : "Please sign in with your Google account to download this image."}
        returnUrl={typeof window !== 'undefined' ? `/image/${image.hashId || image.id}` : `/image/${image.id}`}
        pendingFavorite={pendingFavorite ? String(image.id) : undefined}
      />
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if image data actually changes
  return (
    prevProps.image.id === nextProps.image.id &&
    prevProps.image.thumbnailUrl === nextProps.image.thumbnailUrl &&
    prevProps.image.blurhash === nextProps.image.blurhash &&
    prevProps.image.title === nextProps.image.title &&
    prevProps.onClick === nextProps.onClick
  );
});

ImageCard.displayName = 'ImageCard';

export default ImageCard;
