'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ImageCard from '@/components/gallery/ImageCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/auth/SignInModal';
import { useRouter } from 'next/navigation';

// Dynamically load ImageModal with SSR disabled to prevent React context issues
const ImageModal = dynamic(() => import('@/components/gallery/ImageModal'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

// Fetch favorited images
async function fetchFavoritedImages() {
  const response = await fetch('/api/favorites', {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    throw new Error('Failed to fetch favorites');
  }
  const data = await response.json();
  
  if (!data.success || !data.data || data.data.length === 0) {
    return { images: [], total: 0 };
  }

  // Backend now returns full image data, so we can use it directly
  return {
    images: data.data,
    total: data.data.length,
  };
}

function FavoritesContent() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isLoadingOAuthImage, setIsLoadingOAuthImage] = useState(false);

  // Fetch favorited images
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavoritedImages,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowSignInModal(true);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch a single image by ID (for OAuth return)
  const fetchImageById = async (id: number) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching image by ID:', error);
      return null;
    }
  };

  const images = data?.images || [];
  const totalImages = data?.total || 0;

  const breakpointColumns = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
  };

  // Handle OAuth return - open image modal if image ID is in URL params
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const imageIdParam = urlParams.get('image');
    if (!imageIdParam) return;
    
    const imageId = parseInt(imageIdParam, 10);
    if (isNaN(imageId)) return;
    
    // Don't reopen if the same image is already selected
    if (selectedImage && selectedImage.id === imageId) return;
    
    const authSuccess = urlParams.get('auth') === 'success';
    
    // Clean up auth and download params immediately to prevent loops
    if (authSuccess && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
        currentUrl.searchParams.delete('auth');
        currentUrl.searchParams.delete('download');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    }
    
    // If images are loaded, find and open the modal immediately
    if (images.length > 0) {
      const image = images.find((img: any) => img.id === imageId);
      if (image) {
        setSelectedImage(image);
        return;
      } else {
        // Image not found in favorites - clean up URL param and don't open modal
        // This handles the case where an image was unfavorited
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('image')) {
          currentUrl.searchParams.delete('image');
          currentUrl.searchParams.delete('download');
          currentUrl.searchParams.delete('auth');
          window.history.replaceState({}, '', currentUrl.toString());
        }
        return;
      }
    }
    
    // If returning from OAuth and images are still loading, fetch it directly
    // But only if we're coming from OAuth (authSuccess), not from a direct URL
    if (authSuccess && images.length === 0) {
      setIsLoadingOAuthImage(true);
      fetchImageById(imageId).then((image) => {
        setIsLoadingOAuthImage(false);
        if (image) {
          // Check if image is in favorites before opening modal
          // If favorites are loaded, verify it's still favorited
          if (images.length > 0) {
            const isFavorited = images.some((img: any) => img.id === imageId);
            if (!isFavorited) {
              // Image not favorited, don't open modal
              const currentUrl = new URL(window.location.href);
              if (currentUrl.searchParams.has('image')) {
                currentUrl.searchParams.delete('image');
                currentUrl.searchParams.delete('download');
                currentUrl.searchParams.delete('auth');
                window.history.replaceState({}, '', currentUrl.toString());
              }
              return;
            }
          }
          setSelectedImage(image);
        }
      });
    }
  }, [images, isAuthenticated, selectedImage]);

  // Close modal if selected image is no longer in favorites
  useEffect(() => {
    if (selectedImage && images.length > 0) {
      const isStillFavorited = images.some((img: any) => img.id === selectedImage.id);
      if (!isStillFavorited) {
        // Image was unfavorited, close the modal
        setSelectedImage(null);
        // Clean up URL params
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('image')) {
          currentUrl.searchParams.delete('image');
          currentUrl.searchParams.delete('download');
          currentUrl.searchParams.delete('auth');
          window.history.replaceState({}, '', currentUrl.toString());
        }
      }
    }
  }, [images, selectedImage]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex((img: any) => img.id === selectedImage.id);
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + images.length) % images.length
      : (currentIndex + 1) % images.length;
    setSelectedImage(images[newIndex]);
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14">
          <div className="container mx-auto px-4 py-20 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Sign in to view favorites</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in with your Google account to view your favorited images.
              </p>
            </div>
          </div>
        </main>
        <SignInModal
          open={showSignInModal}
          onOpenChange={setShowSignInModal}
          title="Sign in to view favorites"
          description="Please sign in with your Google account to view your favorited images."
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Loading overlay for OAuth return - shows while fetching specific image */}
      {isLoadingOAuthImage && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Opening image...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        </div>
      )}
      
      <main className={`pt-14 ${isLoadingOAuthImage ? 'opacity-0 pointer-events-none' : ''}`}>
        {/* Page Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          
          <div className="relative container mx-auto px-4 py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-8 w-8 text-destructive fill-current" />
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  <span className="gradient-text">My Favorites</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg mb-6">
                {isLoading ? 'Loading...' : `You have ${totalImages.toLocaleString()} favorited image${totalImages !== 1 ? 's' : ''}`}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-4 md:p-6 lg:p-8">
          {/* Loading State */}
          {isLoading && (
            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-64 mb-4 rounded-2xl" />
              ))}
            </Masonry>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">
                {error instanceof Error && error.message === 'Authentication required'
                  ? 'Please sign in to view your favorites'
                  : 'Failed to load favorites. Please try again.'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )}

          {/* Images Grid */}
          {!error && !isLoading && (
            <>
              {images.length > 0 ? (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="masonry-grid"
                  columnClassName="masonry-grid-column"
                >
                  {images.map((image: any, index: number) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3) }}
                    >
                      <ImageCard
                        image={image}
                        onClick={() => {
                          // Navigate to dedicated image page using hash ID (secure) or numeric ID (fallback)
                          const imageId = (image as any).hashId || image.id;
                          router.push(`/image/${imageId}`);
                        }}
                      />
                    </motion.div>
                  ))}
                </Masonry>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start favoriting images by clicking the heart icon on any image
                  </p>
                  <button
                    onClick={() => router.push('/gallery')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Browse Gallery
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Image Modal */}
      <Suspense fallback={null}>
        {selectedImage && (
          <ImageModal
            image={selectedImage}
            currentPage="favorites"
            onClose={() => {
              setSelectedImage(null);
              // Clean up image param from URL when modal closes
              const currentUrl = new URL(window.location.href);
              if (currentUrl.searchParams.has('image')) {
                currentUrl.searchParams.delete('image');
                currentUrl.searchParams.delete('download');
                currentUrl.searchParams.delete('auth');
                window.history.replaceState({}, '', currentUrl.toString());
              }
            }}
            onNavigate={handleNavigate}
          />
        )}
      </Suspense>

      <Footer />
    </div>
  );
}

export default function FavoritesPage() {
  return <FavoritesContent />;
}
