'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowUp, ArrowDown, Sparkles, TrendingUp, Clock, Grid3X3, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ImageCard from '@/components/gallery/ImageCard';
import FilterSidebar from '@/components/gallery/FilterSidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically load ImageModal with SSR disabled to prevent React context issues
const ImageModal = dynamic(() => import('@/components/gallery/ImageModal'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const sortTabs = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'popular', label: 'Popular', icon: TrendingUp },
  { id: 'trending', label: 'Trending', icon: Sparkles },
];

// Fetch images from API
async function fetchImages(params: {
  category?: string;
  search?: string;
  orientation?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.search) searchParams.set('q', params.search);
  if (params.orientation) searchParams.set('orientation', params.orientation);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  const response = await fetch(`/api/images?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch images');
  return response.json();
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const searchQuery = searchParams.get('q') || '';
  
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<any[]>([]); // Accumulated images from all pages
  const [currentPage, setCurrentPage] = useState(0); // 0 = initial 30, then 1, 2, 3... for 50 each
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isLoadingOAuthImage, setIsLoadingOAuthImage] = useState(false); // Track OAuth return image loading
  
  // Memoize images array to prevent unnecessary re-renders of ImageCard components
  const memoizedImages = useMemo(() => loadedImages, [loadedImages]);
  const INITIAL_LIMIT = 30;
  const PAGE_SIZE = 50;
  const [filters, setFilters] = useState({
    categories: categoryParam ? [categoryParam] : [],
    orientation: 'all',
    colors: [] as string[],
    sort: sortParam || 'recent',
  });

  // Reset pagination when filters change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      categories: categoryParam ? [categoryParam] : prev.categories,
      sort: sortParam || prev.sort,
    }));
    // Reset pagination when filters/search change
    setCurrentPage(0);
    setLoadedImages([]);
  }, [categoryParam, sortParam, searchQuery, filters.orientation]);

  // Calculate limit and offset based on current page
  const getLimitAndOffset = () => {
    if (currentPage === 0) {
      return { limit: INITIAL_LIMIT, offset: 0 };
    }
    // Page 1+ loads 50 images each, starting after the initial 30
    const offset = INITIAL_LIMIT + (currentPage - 1) * PAGE_SIZE;
    return { limit: PAGE_SIZE, offset };
  };

  const { limit, offset } = getLimitAndOffset();

  // Fetch images using React Query with session-level caching
  const { data, isLoading, error, refetch } = useQuery<{
    success: boolean;
    data: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>({
    queryKey: ['images', filters.categories[0], searchQuery, filters.orientation, filters.sort, limit, offset],
    queryFn: () => fetchImages({
      category: filters.categories[0],
      search: searchQuery,
      orientation: filters.orientation,
      sort: filters.sort,
      limit,
      offset,
    }),
    // Session-level cache: 30 minutes stale time (inherits from defaultOptions)
    // This means data won't be refetched for 30 minutes after first load
    staleTime: 30 * 60 * 1000, // 30 minutes - data stays fresh
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in cache for entire session
    // Don't refetch when component remounts (e.g., when modal closes)
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
    // Don't refetch on reconnect
    refetchOnReconnect: false,
    enabled: true, // Always enabled, but we'll show loading overlay for OAuth return
  });

  // Update loaded images when new data arrives
  useEffect(() => {
    if (data?.data) {
      if (currentPage === 0) {
        // First page: replace all images
        setLoadedImages(data.data);
      } else {
        // Subsequent pages: append new images
        setLoadedImages(prev => [...prev, ...data.data]);
      }
    }
  }, [data, currentPage]);

  // Use memoized images to prevent re-renders when modal state changes
  const images = memoizedImages;
  const hasMore = data?.pagination?.hasMore || false;
  const totalImages = data?.pagination?.total || 0;
  const isInitialLoading = isLoading && currentPage === 0 && loadedImages.length === 0;

  // Fetch a single image by ID or hashId (supports both)
  const fetchImageById = useCallback(async (idOrHash: number | string) => {
    try {
      const response = await fetch(`/api/images/${idOrHash}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching image by ID:', error);
      return null;
    }
  }, []);

  // Open image modal if image ID or hashId is in URL params
  // This handles both direct navigation and OAuth return with image context
  // Supports both hashId (e.g., "a3xK9m") and numeric ID (e.g., "73") for backward compatibility
  useEffect(() => {
    const imageIdParam = searchParams.get('image');
    if (!imageIdParam) {
      setIsLoadingOAuthImage(false);
      return;
    }
    
    // Try to find image in loaded images first (by hashId or numeric ID)
    const foundImage = images.find((img: any) => 
      img.hashId === imageIdParam || String(img.id) === imageIdParam
    );
    
    if (foundImage) {
      // Image is already loaded, use it directly
      if (selectedImage && (selectedImage.id === foundImage.id || selectedImage.hashId === imageIdParam)) {
        setIsLoadingOAuthImage(false);
        return;
      }
      setSelectedImage(foundImage);
      setIsLoadingOAuthImage(false);
      return;
    }
    
    // Image not in loaded list, fetch it by hashId or numeric ID
    // The API supports both hashId and numeric ID
    const imageIdOrHash = imageIdParam; // Can be hashId (string) or numeric ID (string)
    
    // Don't reopen if the same image is already selected
    if (selectedImage && (selectedImage.hashId === imageIdOrHash || String(selectedImage.id) === imageIdOrHash)) {
      setIsLoadingOAuthImage(false);
      return;
    }
    
    const authSuccess = searchParams.get('auth') === 'success';
    
    // Clean up auth and download params immediately to prevent loops
    if (authSuccess && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
        currentUrl.searchParams.delete('auth');
        currentUrl.searchParams.delete('download');
        // Keep image param for now - will be cleaned when modal closes
        window.history.replaceState({}, '', currentUrl.toString());
      }
    }
    
    // If returning from OAuth, prioritize fetching the specific image first
    // Show loading state and fetch image directly without waiting for gallery
    if (authSuccess) {
      setIsLoadingOAuthImage(true);
      fetchImageById(imageIdOrHash).then((image) => {
        setIsLoadingOAuthImage(false);
        if (image) {
          setSelectedImage(image);
          // Only clean up auth/download params, NOT the image param
          // The image param should stay in URL to keep modal open
          if (typeof window !== 'undefined') {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
              currentUrl.searchParams.delete('auth');
              currentUrl.searchParams.delete('download');
              // Keep image param to maintain modal state
              window.history.replaceState({}, '', currentUrl.toString());
            }
          }
        }
      });
      return; // Don't wait for gallery images when returning from OAuth
    }
    
    // If images are loaded, find and open the modal immediately
    if (images.length > 0) {
      const image = images.find((img: any) => 
        img.hashId === imageIdOrHash || String(img.id) === imageIdOrHash
      );
      if (image) {
        // Only set selectedImage if it's different (to avoid unnecessary re-renders)
        if (!selectedImage || (selectedImage.id !== image.id && selectedImage.hashId !== image.hashId)) {
          setSelectedImage(image);
        }
        setIsLoadingOAuthImage(false);
        // Only clean up auth/download params, NOT the image param
        // The image param should stay in URL to keep modal open
        if (typeof window !== 'undefined' && authSuccess) {
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
            currentUrl.searchParams.delete('auth');
            currentUrl.searchParams.delete('download');
            // Keep image param to maintain modal state
            window.history.replaceState({}, '', currentUrl.toString());
          }
        }
        return;
      }
    }
    
    // If image not found in filtered results, fetch it directly from API
    if (images.length > 0) {
      setIsLoadingOAuthImage(true);
      fetchImageById(imageIdOrHash).then((image) => {
        setIsLoadingOAuthImage(false);
        if (image) {
          setSelectedImage(image);
          // Only clean up auth/download params when returning from OAuth, NOT the image param
          // The image param should stay in URL to keep modal open
          if (typeof window !== 'undefined' && authSuccess) {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.has('auth') || currentUrl.searchParams.has('download')) {
              currentUrl.searchParams.delete('auth');
              currentUrl.searchParams.delete('download');
              // Keep image param to maintain modal state
              window.history.replaceState({}, '', currentUrl.toString());
            }
          }
        }
      });
    }
    
    // If images are still loading, we'll retry when images load (this effect will re-run due to images dependency)
  }, [searchParams, images, selectedImage, fetchImageById]);
  const isLoadingMore = isLoading && currentPage > 0;

  const breakpointColumns = viewMode === 'masonry' 
    ? { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 }
    : { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 };

  // Load next page
  const loadNextPage = useCallback(() => {
    if (isLoading || !hasMore) return;
    setCurrentPage(prev => prev + 1);
  }, [isLoading, hasMore]);

  // Scroll tracking for "Scroll to Top" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollTop(scrollTop > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stable handler function to prevent ImageCard re-renders when modal state changes
  const handleImageClick = useCallback((image: any) => {
    setSelectedImage(image);
    // Add image hashId to URL for shareable links (use hashId instead of numeric ID)
    const currentUrl = new URL(window.location.href);
    const imageIdentifier = image.hashId || String(image.id);
    currentUrl.searchParams.set('image', imageIdentifier);
    window.history.pushState({}, '', currentUrl.toString());
  }, []); // Empty deps - function is stable and doesn't depend on any values

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex((img: any) => img.id === selectedImage.id);
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + images.length) % images.length
      : (currentIndex + 1) % images.length;
    setSelectedImage(images[newIndex]);
  };

  const handleSortChange = (sortId: string) => {
    setFilters(prev => ({ ...prev, sort: sortId }));
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortId);
    router.push(`/gallery?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (localSearch.trim()) {
      params.set('q', localSearch);
    } else {
      params.delete('q');
    }
    router.push(`/gallery?${params.toString()}`);
  };

  const clearSearch = () => {
    setLocalSearch('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.push(`/gallery?${params.toString()}`);
  };

  const activeFiltersCount = filters.categories.length + filters.colors.length + (filters.orientation !== 'all' ? 1 : 0);

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
        {/* Enhanced Page Header */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          
          <div className="relative container mx-auto px-4 py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
                {filters.categories.length > 0 
                  ? <span className="gradient-text">{filters.categories[0].charAt(0).toUpperCase() + filters.categories[0].slice(1)}</span>
                  : 'Explore Images'}
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                {isLoading ? 'Loading...' : `Discover ${totalImages.toLocaleString()} stunning free images for your creative projects`}
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative max-w-2xl">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search for images..."
                    className="w-full h-14 pl-12 pr-24 bg-card/80 backdrop-blur-sm rounded-2xl text-foreground placeholder:text-muted-foreground border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {localSearch && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-secondary transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3 gap-4 min-h-[64px]">
              {/* Sort Tabs */}
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl">
                {sortTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSortChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.sort === tab.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="hidden md:flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                  <button
                    onClick={() => setViewMode('masonry')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'masonry' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Masonry view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>

                {/* Filter Button */}
                <Button
                  variant="outline"
                  className="gap-2 relative"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Pills */}
        <AnimatePresence>
          {(filters.categories.length > 0 || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border/50"
            >
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchQuery && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                      onClick={clearSearch}
                    >
                      Search: "{searchQuery}"
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                  {filters.categories.map((cat) => (
                    <motion.button
                      key={cat}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm hover:bg-accent/20 transition-colors"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        categories: prev.categories.filter(c => c !== cat)
                      }))}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex">
          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* Gallery Grid */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            {/* Results count */}
            {!isInitialLoading && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{images.length}</span> of{' '}
                  <span className="text-foreground font-medium">{totalImages.toLocaleString()}</span> images
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">Failed to load images. Please try again.</p>
                <Button onClick={() => refetch()} variant="outline">
                  Retry
                </Button>
              </div>
            )}

            {/* Initial Loading State */}
            {isInitialLoading && (
              <Masonry
                breakpointCols={breakpointColumns}
                className="masonry-grid"
                columnClassName="masonry-grid-column"
              >
                {Array.from({ length: INITIAL_LIMIT }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-64 mb-4 rounded-2xl" />
                ))}
              </Masonry>
            )}

            {/* Images Grid */}
            {!error && (
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
                      onClick={() => handleImageClick(image)}
                    />
                  </motion.div>
                ))}
              </Masonry>
            )}

            {/* Show More Button - Always visible when there are more images */}
            {hasMore && images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Button
                  onClick={loadNextPage}
                  size="lg"
                  className="px-8 py-6 text-base font-semibold"
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Show More
                      <ArrowDown className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                  Showing {images.length} of {totalImages.toLocaleString()} images
                </p>
              </motion.div>
            )}

            {/* End of Results */}
            {!hasMore && images.length > 0 && !isLoading && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">You've seen all the images</p>
                <Button variant="outline" onClick={scrollToTop} className="gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Back to Top
                </Button>
              </motion.div>
            )}

            {/* Empty State */}
            {images.length === 0 && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No images found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
                <Button variant="outline" onClick={() => {
                  setFilters({ categories: [], orientation: 'all', colors: [], sort: 'recent' });
                  clearSearch();
                }}>
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal - Lazy Loaded */}
      <AnimatePresence>
        {selectedImage && (
          <Suspense fallback={
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <ImageModal
              image={selectedImage}
              currentPage="gallery"
              onClose={() => {
                // Use requestAnimationFrame to defer state update and prevent unnecessary re-renders
                // This ensures React Query cache is used instead of triggering refetch
                requestAnimationFrame(() => {
                  setSelectedImage(null);
                  // Clean up image param from URL when modal closes
                  const currentUrl = new URL(window.location.href);
                  if (currentUrl.searchParams.has('image')) {
                    currentUrl.searchParams.delete('image');
                    currentUrl.searchParams.delete('download');
                    currentUrl.searchParams.delete('auth');
                    window.history.replaceState({}, '', currentUrl.toString());
                  }
                });
              }}
              onNavigate={handleNavigate}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 rounded-full bg-card border border-border shadow-xl hover:shadow-2xl hover:border-primary/50 transition-all z-30 group"
          >
            <ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
