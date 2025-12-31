import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';
import { Filter, Loader2, ArrowUp } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ImageCard from '@/components/gallery/ImageCard';
import ImageModal from '@/components/gallery/ImageModal';
import FilterSidebar from '@/components/gallery/FilterSidebar';
import { Button } from '@/components/ui/button';

// Sample image data
const generateImages = (count: number, startId: number = 0) => {
  const titles = [
    'Mountain Sunrise', 'Urban Streets', 'Abstract Colors', 'Ocean Waves',
    'Forest Path', 'City Lights', 'Desert Sunset', 'Tropical Paradise',
    'Winter Snow', 'Spring Flowers', 'Autumn Leaves', 'Night Sky',
    'Coffee Morning', 'Tech Workspace', 'Travel Adventure', 'Portrait Light',
  ];
  const authors = ['johndoe', 'janecreative', 'alexphoto', 'samdesign', 'mikeart'];
  const categories = ['nature', 'business', 'travel', 'people', 'abstract', 'food'];
  const tags = ['landscape', 'portrait', 'minimal', 'colorful', 'dark', 'bright', 'moody'];

  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    url: `https://picsum.photos/seed/${startId + i}/600/${300 + Math.floor(Math.random() * 400)}`,
    title: titles[Math.floor(Math.random() * titles.length)],
    author: authors[Math.floor(Math.random() * authors.length)],
    downloads: Math.floor(Math.random() * 5000) + 100,
    height: 300 + Math.floor(Math.random() * 400),
    category: categories[Math.floor(Math.random() * categories.length)],
    tags: tags.slice(0, Math.floor(Math.random() * 4) + 2),
  }));
};

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const searchQuery = searchParams.get('q') || '';
  
  const [allImages] = useState(() => generateImages(200));
  const [selectedImage, setSelectedImage] = useState<typeof allImages[0] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(40);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filters, setFilters] = useState({
    categories: categoryParam ? [categoryParam] : [],
    orientation: 'all',
    colors: [] as string[],
    sort: sortParam || 'recent',
  });

  // Update filters when URL params change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      categories: categoryParam ? [categoryParam] : prev.categories,
      sort: sortParam || prev.sort,
    }));
  }, [categoryParam, sortParam]);

  // Filter images based on current filters
  const filteredImages = allImages.filter(img => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(img.category)) {
      return false;
    }
    // Search filter
    if (searchQuery && !img.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Orientation filter
    if (filters.orientation !== 'all') {
      const isLandscape = img.height < 400;
      const isPortrait = img.height > 500;
      if (filters.orientation === 'landscape' && !isLandscape) return false;
      if (filters.orientation === 'portrait' && !isPortrait) return false;
      if (filters.orientation === 'square' && (isLandscape || isPortrait)) return false;
    }
    return true;
  });

  // Sort images
  const sortedImages = [...filteredImages].sort((a, b) => {
    if (filters.sort === 'popular') return b.downloads - a.downloads;
    if (filters.sort === 'downloads') return b.downloads - a.downloads;
    return b.id - a.id; // recent
  });

  const images = sortedImages.slice(0, displayCount);
  const hasMore = displayCount < sortedImages.length;

  const breakpointColumns = {
    default: 4,
    1280: 4,
    1024: 3,
    768: 2,
    640: 2,
  };

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 20, sortedImages.length));
      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore, sortedImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowScrollTop(scrollTop > 500);
      
      if (
        window.innerHeight + scrollTop >= document.documentElement.scrollHeight - 500 &&
        !isLoading &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoading, hasMore]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + images.length) % images.length
      : (currentIndex + 1) % images.length;
    setSelectedImage(images[newIndex]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Page Header */}
        <div className="bg-card border-b border-border py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {filters.categories.length > 0 
                    ? `${filters.categories[0].charAt(0).toUpperCase() + filters.categories[0].slice(1)} Images`
                    : 'Explore Images'}
                </h1>
                <p className="text-muted-foreground">
                  {images.length.toLocaleString()} free images available
                </p>
              </div>
              <Button
                variant="outline"
                className="lg:hidden gap-2"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>

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
            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </Masonry>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="ml-3 text-muted-foreground">Loading more images...</span>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-muted-foreground mb-4">No more images to load</p>
                <Button variant="outline" onClick={scrollToTop} className="gap-2">
                  <ArrowUp className="h-4 w-4" />
                  Back to Top
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-glow hover:shadow-[0_0_60px_hsla(262,83%,58%,0.5)] transition-all z-30"
        >
          <ArrowUp className="h-6 w-6" />
        </motion.button>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
