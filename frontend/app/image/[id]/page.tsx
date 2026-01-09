'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Loader2, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

// Dynamically load ImageModal with SSR disabled to prevent React context issues
const ImageModal = dynamic(() => import('@/components/gallery/ImageModal'), {
  ssr: false,
  loading: () => null,
});

// Fetch a single image by ID (accepts both hash ID and numeric ID)
async function fetchImageById(idOrHash: string | number) {
  const response = await fetch(`/api/images/${idOrHash}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Image not found');
    }
    throw new Error('Failed to fetch image');
  }
  const result = await response.json();
  return result.success ? result.data : null;
}

function ImagePageContent() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  // Accept both hash ID (string) and numeric ID (for backward compatibility)
  const imageIdOrHash = params?.id as string | undefined;
  
  // Ensure we stay on /image/[id] - prevent any navigation away from this page
  useEffect(() => {
    if (typeof window === 'undefined' || !imageIdOrHash) return;
    
    // If we're on /image/[id], ensure we stay here
    const currentPath = window.location.pathname;
    const expectedPath = `/image/${imageIdOrHash}`;
    
    // If somehow we're not on the correct path, redirect back to it
    if (currentPath !== expectedPath && !currentPath.startsWith('/image/')) {
      // Only redirect if we're completely off the image page
      // Don't redirect if we're just cleaning up query params
      const urlParams = new URLSearchParams(window.location.search);
      const hasOAuthParams = urlParams.has('auth') || urlParams.has('download');
      
      // If we have OAuth params, we're probably returning from OAuth, so don't redirect yet
      if (!hasOAuthParams) {
        router.replace(expectedPath);
      }
    }
  }, [imageIdOrHash, router]);

  // Fetch the image by ID or hash
  const { data: image, isLoading, error } = useQuery({
    queryKey: ['image', imageIdOrHash],
    queryFn: () => fetchImageById(imageIdOrHash!),
    enabled: !!imageIdOrHash,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Set selected image when data is loaded
  useEffect(() => {
    if (image) {
      setSelectedImage(image);
    }
  }, [image]);

  // Handle OAuth return - check for auth=success param
  useEffect(() => {
    if (!image || typeof window === 'undefined') return;

    // Use window.location.search instead of useSearchParams to avoid Suspense issues
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';

    // Clean up OAuth-related params but preserve the /image/[id] path
    if (authSuccess) {
      const currentUrl = new URL(window.location.href);
      // Only clean up query params, don't change the pathname
      if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
        currentUrl.searchParams.delete('auth');
        currentUrl.searchParams.delete('download');
        // Preserve the /image/[id] pathname
        window.history.replaceState({}, '', currentUrl.toString());
      }
    }
  }, [image]);

  // Handle navigation between images
  const handleNavigate = (direction: 'prev' | 'next') => {
    // This could be implemented to navigate to prev/next images
    // For now, we'll just keep it as a placeholder
    console.log(`Navigate ${direction}`);
  };

  // Determine current page context for ImageModal
  // Since we're on /image/[id], we want to stay on this page after favoriting
  const getCurrentPage = () => {
    if (typeof window === 'undefined') return 'gallery';
    const pathname = window.location.pathname;
    // If we're on /image/[id], we want to stay here, so return 'gallery' context
    // but the returnUrl will keep us on /image/[id]
    if (pathname.startsWith('/favorites')) return 'favorites';
    if (pathname.startsWith('/image/')) return 'gallery'; // Stay on image page
    return 'gallery';
  };

  if (!imageIdOrHash) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Image ID</h1>
            <p className="text-muted-foreground mb-6">The image ID is invalid.</p>
            <Button onClick={() => router.push('/gallery')}>Go to Gallery</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14">
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Loading image...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-14">
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Image Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'The image you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/gallery')}>Go to Gallery</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14">
        {/* Back button */}
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </main>

      {/* Image Modal */}
      <Suspense fallback={null}>
        {selectedImage && (
          <ImageModal
            image={selectedImage}
            currentPage={getCurrentPage()}
            onClose={() => {
              // Navigate back when modal closes
              router.back();
            }}
            onNavigate={handleNavigate}
          />
        )}
      </Suspense>

      <Footer />
    </div>
  );
}

export default function ImagePage() {
  return <ImagePageContent />;
}
