import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Loader2, ArrowUp, Sparkles, TrendingUp, Clock, Grid3X3, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
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

const sortTabs = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'popular', label: 'Popular', icon: TrendingUp },
  { id: 'trending', label: 'Trending', icon: Sparkles },
];

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const sortParam = searchParams.get('sort');
  const searchQuery = searchParams.get('q') || '';
  
  const [allImages] = useState(() => generateImages(200));
  const [selectedImage, setSelectedImage] = useState<typeof allImages[0] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(40);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('masonry');
  const [localSearch, setLocalSearch] = useState(searchQuery);
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

  const breakpointColumns = viewMode === 'masonry' 
    ? { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 }
    : { default: 4, 1280: 4, 1024: 3, 768: 2, 640: 2 };

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

  const handleSortChange = (sortId: string) => {
    setFilters(prev => ({ ...prev, sort: sortId }));
    setSearchParams(prev => {
      prev.set('sort', sortId);
      return prev;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchParams(prev => {
        prev.set('q', localSearch);
        return prev;
      });
    } else {
      setSearchParams(prev => {
        prev.delete('q');
        return prev;
      });
    }
  };

  const clearSearch = () => {
    setLocalSearch('');
    setSearchParams(prev => {
      prev.delete('q');
      return prev;
    });
  };

  const activeFiltersCount = filters.categories.length + filters.colors.length + (filters.orientation !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
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
                Discover {filteredImages.length.toLocaleString()} stunning free images for your creative projects
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
        <div className="sticky top-20 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3 gap-4">
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-medium">{images.length}</span> of{' '}
                <span className="text-foreground font-medium">{filteredImages.length.toLocaleString()}</span> images
              </p>
            </div>

            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.02, 0.3) }}
                >
                  <ImageCard
                    image={image}
                    onClick={() => setSelectedImage(image)}
                  />
                </motion.div>
              ))}
            </Masonry>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <span className="mt-4 text-muted-foreground">Loading more images...</span>
              </motion.div>
            )}

            {/* End of Results */}
            {!hasMore && images.length > 0 && (
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
            {images.length === 0 && !isLoading && (
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

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onNavigate={handleNavigate}
          />
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
};

export default Gallery;
