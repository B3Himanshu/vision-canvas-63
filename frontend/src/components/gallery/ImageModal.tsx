'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Download, X, Share2, Expand, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Monitor, Smartphone, Loader2, Image as ImageIcon, Palette, Shapes } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/auth/SignInModal';
import { useQueryClient } from '@tanstack/react-query';

interface ImageModalProps {
  image: {
    id: number;
    hashId?: string; // Secure hash ID for URLs (e.g., "a3xK9m")
    url?: string; // For backward compatibility
    thumbnailUrl?: string; // API returns this
    imageUrl?: string; // API returns this (full resolution)
    title: string;
    author: string;
    downloads: number;
    category: string;
    tags: string[];
    type?: 'photo' | 'illustration' | 'icon';
  } | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentPage?: 'gallery' | 'favorites'; // Explicitly pass current page context
}

// Generate recommended images based on seed
const generateRecommendedImages = (currentId: number, count: number = 8) => {
  return Array.from({ length: count }, (_, i) => ({
    id: currentId + 100 + i,
    url: `https://picsum.photos/seed/${currentId + 100 + i}/400/300`,
    title: ['Mountain Vista', 'Ocean Dreams', 'City Lights', 'Forest Path', 'Desert Sun', 'Aurora Night', 'Coastal Breeze', 'Valley Mist'][i % 8],
    author: ['alex', 'maria', 'john', 'emma', 'david', 'sarah', 'mike', 'lisa'][i % 8],
    downloads: Math.floor(Math.random() * 5000) + 500,
  }));
};

const ImageModal = ({ image, onClose, onNavigate, currentPage }: ImageModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<string | null>(null);
  const [pendingFavorite, setPendingFavorite] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasCheckedFavoriteRef = useRef(false); // Track if we've already checked favorite status for this image
  const currentImageIdRef = useRef<number | null>(null); // Track current image ID

  // Check if image is favorited on mount or when image changes (silently in background)
  // Only check once per image ID to prevent duplicate API calls
  useEffect(() => {
    if (!image) {
      setIsLiked(false);
      hasCheckedFavoriteRef.current = false;
      currentImageIdRef.current = null;
      return;
    }

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
  }, [image?.id, isAuthenticated]); // Only depend on image ID and auth state, not user object

  // Memoize checkFavoriteStatus to prevent it from being recreated on every render
  const checkFavoriteStatus = React.useCallback(async () => {
    if (!image) {
      return;
    }
    try {
      const response = await fetch(`/api/favorites/check?imageId=${image.id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isFavorited || false);
      }
    } catch (error) {
      console.error('[ImageModal] checkFavoriteStatus: Error', error);
    }
  }, [image?.id]); // Only recreate if image ID changes

  const handleLike = async (e?: React.MouseEvent) => {
    // Stop event propagation to prevent any parent click handlers
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    console.log('[ImageModal] handleLike called', {
      imageId: image?.id,
      hashId: (image as any)?.hashId,
      isLiked,
      isAuthenticated,
      currentPage,
    });

    if (!image) {
      console.warn('[ImageModal] handleLike: No image provided');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('[ImageModal] handleLike: User not authenticated, opening sign-in modal');
      setPendingFavorite(true);
      setShowSignInModal(true);
      return;
    }

    // Optimistically update UI immediately (no loading state)
    const previousLikedState = isLiked;
    console.log('[ImageModal] handleLike: Optimistically updating UI', {
      previousLikedState,
      newLikedState: !isLiked,
    });
    setIsLiked(!isLiked);

    try {
      if (previousLikedState) {
        // Remove from favorites
        console.log('[ImageModal] handleLike: Removing from favorites', { imageId: image.id });
        const response = await fetch(`/api/favorites?imageId=${image.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        console.log('[ImageModal] handleLike: DELETE response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => null);
          console.log('[ImageModal] handleLike: Successfully removed from favorites', responseData);
          toast.success('Removed from favorites');
          
          // Invalidate favorites query to update the favorites page
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
          
          // If we're on the favorites page, close the modal since the image is no longer favorited
          if (currentPage === 'favorites') {
            console.log('[ImageModal] handleLike: On favorites page, closing modal');
            setTimeout(() => {
              onClose();
            }, 500); // Small delay to show the toast message
          }
        } else {
          // Revert on error
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[ImageModal] handleLike: Failed to remove from favorites', {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          setIsLiked(previousLikedState);
          toast.error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        console.log('[ImageModal] handleLike: Adding to favorites', { imageId: image.id });
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ imageId: image.id }),
        });
        
        console.log('[ImageModal] handleLike: POST response', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => null);
          console.log('[ImageModal] handleLike: Successfully added to favorites', responseData);
          toast.success('Added to favorites');
          
          // Invalidate favorites query to update the favorites page
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
          
          // Do NOT navigate or close modal - stay on current page
        } else {
          // Revert on error
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[ImageModal] handleLike: Failed to add to favorites', {
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
      console.error('[ImageModal] handleLike: Exception occurred', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        previousLikedState,
      });
      setIsLiked(previousLikedState);
      toast.error('Failed to update favorite');
    }
  };

  const recommendedImages = useMemo(() => 
    image ? generateRecommendedImages(image.id) : [], 
    [image?.id]
  );

  if (!image) return null;

  const imageType = image.type || 'photo';

  // Get return URL that preserves current page context
  // Now uses dedicated /image/[id] route with hash IDs for secure URLs
  // Memoized to prevent recalculation on every render
  const returnUrl = useMemo(() => {
    if (!image) return '/gallery';
    
    // Use hash ID (secure) if available, fallback to numeric ID for backward compatibility
    const imageId = (image as any).hashId || image.id;
    // Always use dedicated image route with hash ID for secure URLs
    // This provides secure URLs like /image/a3xK9m instead of /image/96
    return `/image/${imageId}`;
  }, [image]);

  // Clean up URL params when modal opens (runs once per image)
  useEffect(() => {
    if (!image || typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasAuth = urlParams.has('auth');
    const hasDownload = urlParams.has('download');
    const imageParam = urlParams.get('image');

    // Clean up OAuth-related params immediately to prevent loops
    // Check both hashId and numeric ID for backward compatibility
    const imageIdentifier = image.hashId || String(image.id);
    if ((hasAuth || hasDownload) && (imageParam === imageIdentifier || imageParam === String(image.id))) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('download');
      newUrl.searchParams.delete('auth');
      // Image param will be cleaned when modal closes
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [image?.id]); // Only run once when image changes

  // Handle OAuth return for favoriting (when auth=success but no download param)
  useEffect(() => {
    if (!image || !isAuthenticated || typeof window === 'undefined' || !pendingFavorite) return;

    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';
    const hasDownload = urlParams.has('download');
    const imageParam = urlParams.get('image');

    // If returning from OAuth with auth=success but no download param, and we were pending favorite
    // This means the user signed in to favorite the image
    if (authSuccess && !hasDownload) {
      // Check if we're on /image/[id] route or if image param matches
      const isOnImagePage = window.location.pathname.startsWith('/image/');
      const imageId = (image as any).hashId || image.id;
      // Check if the current pathname matches the image hash ID or numeric ID
      const pathnameMatches = isOnImagePage && (
        window.location.pathname === `/image/${imageId}` || 
        window.location.pathname === `/image/${image.id}`
      );
      const imageIdMatches = !imageParam || imageParam === String(image.id) || imageParam === String(imageId);
      
      if (pathnameMatches || imageIdMatches) {
        // Automatically favorite the image
        const favoriteImage = async () => {
          try {
            const response = await fetch('/api/favorites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ imageId: image.id }),
            });
            if (response.ok) {
              setIsLiked(true);
              toast.success('Added to favorites');
              // Invalidate favorites query to update the favorites page
              queryClient.invalidateQueries({ queryKey: ['favorites'] });
            }
          } catch (error) {
            console.error('Error favoriting image after OAuth:', error);
            toast.error('Failed to favorite image');
          } finally {
            // Reset pending favorite state
            setPendingFavorite(false);
            // Clean up URL params but keep the /image/[id] path
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('auth');
            newUrl.searchParams.delete('download');
            // Only delete image param if it exists (for query param URLs)
            if (newUrl.searchParams.has('image')) {
              newUrl.searchParams.delete('image');
            }
            // Preserve the pathname (e.g., /image/95)
            window.history.replaceState({}, '', newUrl.toString());
          }
        };

        favoriteImage();
      }
    }
  }, [image?.id, isAuthenticated, pendingFavorite, queryClient]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!image) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onNavigate) {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight' && onNavigate) {
        onNavigate('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose, onNavigate]);

  const handleShare = async () => {
    // Use dedicated image route with hash ID for secure URLs
    const imageId = (image as any).hashId || image.id;
    const shareUrl = `${window.location.origin}/image/${imageId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async (format: string, dimensions: string) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store pending download and current page URL
      setPendingDownload(format);
      setShowSignInModal(true);
      return;
    }

    setIsDownloading(format);
    
    try {
      // Use hash ID (secure) if available, fallback to numeric ID for backward compatibility
      const imageId = (image as any).hashId || image.id;
      
      // All downloads use highest quality (PNG/JPG) format
      let imageUrl: string;
      if (format === 'original') {
        imageUrl = `/api/images/${imageId}/original`; // Original size, highest quality
      } else if (format === '16x9') {
        imageUrl = `/api/images/${imageId}/download/16x9`; // 1920x1080, highest quality
      } else if (format === '9x16') {
        imageUrl = `/api/images/${imageId}/download/9x16`; // 1080x1920, highest quality
      } else {
        // Fallback to original
        imageUrl = `/api/images/${imageId}/original`;
      }
      
      const response = await fetch(imageUrl, {
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsDownloading(null);
          setShowSignInModal(true);
          return;
        }
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Get file extension from Content-Type header or blob type
      const contentType = response.headers.get('content-type') || blob.type;
      const getExtensionFromMime = (mime: string): string => {
        if (mime.includes('png')) return 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        return 'jpg'; // Default fallback (all downloads are PNG/JPG now)
      };
      
      // Use setTimeout to ensure DOM operations happen after current execution context
      setTimeout(() => {
        try {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // All formats now use highest quality (PNG/JPG)
          const extension = getExtensionFromMime(contentType);
          const formatLabel = format === 'original' ? 'original' : format;
          link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}-${formatLabel}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Revoke URL after a delay to ensure download starts
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 100);
          
          // Clean up image param from URL after successful download
              const currentUrl = new URL(window.location.href);
              const imageId = (image as any).hashId || image.id;
              if (currentUrl.searchParams.get('image') === String(image.id) || currentUrl.pathname.includes(`/image/${imageId}`)) {
                currentUrl.searchParams.delete('image');
                currentUrl.searchParams.delete('download');
                currentUrl.searchParams.delete('auth');
                window.history.replaceState({}, '', currentUrl.toString());
              }
          
          // Show success toast
          const formatNames: Record<string, string> = {
            'original': 'Original (Highest Quality)',
            '16x9': '16:9 Landscape (Highest Quality)',
            '9x16': '9:16 Portrait (Highest Quality)',
          };
          const qualityLabel = formatNames[format] || `${format} (Highest Quality)`;
          toast.success(`Downloaded ${qualityLabel} successfully!`, {
            description: `Image saved as ${image.title.toLowerCase().replace(/\s+/g, '-')}-${formatLabel}.${extension}`,
          });
        } catch (domError) {
          console.error('DOM operation failed:', domError);
          toast.error('Download failed. Please try again.');
        } finally {
          setIsDownloading(null);
        }
      }, 0);
    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(null);
      
      // Only show sign-in modal if it's an auth error
      if (error instanceof Error && error.message.includes('401')) {
        setShowSignInModal(true);
      }
      
      toast.error('Download failed. Please try again.', {
        description: error instanceof Error ? error.message : 'An error occurred while downloading.',
      });
    }
  };

  const handleRecommendedClick = (recImage: typeof recommendedImages[0]) => {
    toast.info(`Opening: ${recImage.title}`);
  };

  // Get type-specific icon and label
  const getTypeInfo = () => {
    switch (imageType) {
      case 'illustration':
        return { icon: Palette, label: 'Illustration', color: 'text-purple-500' };
      case 'icon':
        return { icon: Shapes, label: 'Icon', color: 'text-blue-500' };
      default:
        return { icon: ImageIcon, label: 'Photo', color: 'text-green-500' };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={image.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
        onClick={(e) => {
          // Only close if clicking directly on the backdrop, not on child elements
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-16 glass"
          onClick={(e) => e.stopPropagation()}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            type="button"
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleLike(e);
              }}
              className={isLiked ? 'text-destructive' : ''}
              title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {onNavigate && (
          <>
            <Button
              variant="glass"
              size="icon-lg"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
              onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="glass"
              size="icon-lg"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
              onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Content */}
        <div 
          className="pt-20 pb-8 px-4 md:px-8 min-h-screen flex flex-col items-center"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {/* Image */}
          <motion.div 
            className="relative w-full max-w-5xl mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-card-hover bg-card">
              <div className="relative w-full" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                <div className="relative w-full" style={{ aspectRatio: '3 / 2', maxHeight: '70vh' }}>
                  <Image
                    src={
                      // Always use full resolution HD image for viewing (public endpoint)
                      image.imageUrl || image.url || `/api/images/${(image as any).hashId || image.id}/file`
                    }
                    alt={image.title}
                    fill
                    className="object-contain"
                    quality={90}
                    priority
                    unoptimized={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                    onError={(e) => {
                      // Fallback to thumbnail if full image fails
                      if (image.thumbnailUrl) {
                        const target = e.target as HTMLImageElement;
                        target.src = image.thumbnailUrl;
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Type Badge */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass ${typeInfo.color}`}>
                  <TypeIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{typeInfo.label}</span>
                </div>
              </div>
              
              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="glass" size="icon">
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Info Panel with Download */}
          <motion.div 
            className="w-full max-w-2xl bg-card rounded-2xl p-6 md:p-8 border border-border"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Title & Meta with Image Preview */}
            <div className="flex gap-4 mb-6">
              {/* Thumbnail Preview */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shadow-lg relative">
                  <Image
                    src={image.thumbnailUrl || image.url || `/api/images/${(image as any).hashId || image.id}/thumbnail`}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                    loading="lazy"
                    unoptimized={true}
                  />
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 truncate">
                  {image.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  By <span className="text-primary font-medium">@{image.author}</span>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {image.downloads.toLocaleString()} downloads · {image.category}
                </p>
              </div>
            </div>

            {/* Download Section - 3 Buttons */}
            <div className="space-y-4">
              {/* Section Title */}
              <div className="text-sm text-muted-foreground">
                Download Formats
              </div>

              {/* Three Download Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* 16:9 Landscape - Highest Quality */}
                <button 
                  onClick={() => handleDownload('16x9', '1920x1080')}
                  disabled={isDownloading === '16x9'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(262, 83%, 58%) 100%)',
                  }}
                  title="Download 16:9 format in highest quality (PNG/JPG)"
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === '16x9' ? 'Downloading...' : '16:9'}
                  </div>
                  <span className="text-white/70 text-xs">1920 × 1080 • PNG/JPG</span>
                </button>

                {/* 9:16 Portrait - Highest Quality */}
                <button 
                  onClick={() => handleDownload('9x16', '1080x1920')}
                  disabled={isDownloading === '9x16'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(330, 81%, 60%) 100%)',
                  }}
                  title="Download 9:16 format in highest quality (PNG/JPG)"
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === '9x16' ? 'Downloading...' : '9:16'}
                  </div>
                  <span className="text-white/70 text-xs">1080 × 1920 • PNG/JPG</span>
                </button>

                {/* Download - Highest Quality */}
                <button 
                  onClick={() => handleDownload('original', 'original')}
                  disabled={isDownloading === 'original'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(330, 81%, 60%) 0%, hsl(199, 89%, 48%) 100%)',
                  }}
                  title="Download original image in highest quality (PNG/JPG format)"
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === 'original' ? 'Downloading...' : 'Download'}
                  </div>
                  <span className="text-white/70 text-xs">PNG/JPG • Highest Quality</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm text-muted-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <Link 
                    key={tag}
                    href={`/gallery?tags=${encodeURIComponent(tag)}`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recommended Images Section */}
          <motion.div 
            className="w-full max-w-5xl mt-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                You might also like
              </h3>
              <button 
                onClick={() => { onClose(); router.push('/gallery'); }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendedImages.map((recImage, index) => (
                <motion.div
                  key={recImage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => handleRecommendedClick(recImage)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <Image 
                      src={recImage.url}
                      alt={recImage.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-medium text-sm truncate">
                          {recImage.title}
                        </p>
                        <p className="text-white/70 text-xs">
                          @{recImage.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Related by Category */}
          <motion.div 
            className="w-full max-w-5xl mt-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                More in {image.category}
              </h3>
              <button 
                onClick={() => { onClose(); router.push(`/gallery?category=${image.category}`); }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Explore {image.category} →
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }, (_, i) => ({
                id: image.id + 200 + i,
                url: `https://picsum.photos/seed/${image.id + 200 + i}/300/200`,
                title: `${image.category} ${i + 1}`,
              })).map((relImage, index) => (
                <motion.div
                  key={relImage.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <Image 
                      src={relImage.url}
                      alt={relImage.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      sizes="(max-width: 768px) 33vw, 16vw"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Sign-In Modal */}
      <SignInModal
        open={showSignInModal}
        onOpenChange={(open) => {
          setShowSignInModal(open);
          if (!open) {
            setPendingFavorite(false);
            setPendingDownload(null);
          }
        }}
        title={pendingFavorite ? "Sign in to favorite" : "Sign in to download"}
        description={pendingFavorite ? "Please sign in with your Google account to favorite images." : "Please sign in with your Google account to download this image."}
        returnUrl={returnUrl}
        pendingDownload={pendingDownload && image && !pendingFavorite ? `${image.id}:${pendingDownload}` : undefined}
        pendingFavorite={pendingFavorite && image ? String(image.id) : undefined}
      />
    </AnimatePresence>
  );
};

export default ImageModal;
