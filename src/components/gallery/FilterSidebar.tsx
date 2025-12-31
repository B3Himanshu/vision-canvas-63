import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    categories: string[];
    orientation: string;
    colors: string[];
    sort: string;
  };
  onFilterChange: (filters: FilterSidebarProps['filters']) => void;
}

const categories = [
  { id: 'nature', name: 'Nature', icon: '🌳', count: '2.5K' },
  { id: 'business', name: 'Business', icon: '💼', count: '1.8K' },
  { id: 'travel', name: 'Travel', icon: '✈️', count: '3.2K' },
  { id: 'people', name: 'People', icon: '👥', count: '1.2K' },
  { id: 'abstract', name: 'Abstract', icon: '🎨', count: '890' },
  { id: 'food', name: 'Food', icon: '🍔', count: '1.5K' },
  { id: 'technology', name: 'Technology', icon: '💻', count: '980' },
  { id: 'architecture', name: 'Architecture', icon: '🏛️', count: '1.1K' },
];

const orientations = [
  { id: 'all', name: 'All Orientations' },
  { id: 'landscape', name: 'Landscape' },
  { id: 'portrait', name: 'Portrait' },
  { id: 'square', name: 'Square' },
];

const colors = [
  { id: 'red', color: '#EF4444', name: 'Red' },
  { id: 'orange', color: '#F97316', name: 'Orange' },
  { id: 'yellow', color: '#EAB308', name: 'Yellow' },
  { id: 'green', color: '#22C55E', name: 'Green' },
  { id: 'blue', color: '#3B82F6', name: 'Blue' },
  { id: 'purple', color: '#A855F7', name: 'Purple' },
  { id: 'pink', color: '#EC4899', name: 'Pink' },
  { id: 'brown', color: '#92400E', name: 'Brown' },
  { id: 'black', color: '#171717', name: 'Black' },
  { id: 'white', color: '#FAFAFA', name: 'White' },
  { id: 'gray', color: '#6B7280', name: 'Gray' },
  { id: 'teal', color: '#14B8A6', name: 'Teal' },
];

const sortOptions = [
  { id: 'recent', name: 'Most Recent' },
  { id: 'popular', name: 'Most Popular' },
  { id: 'downloads', name: 'Most Downloaded' },
  { id: 'random', name: 'Random' },
];

const FilterSidebar = ({ isOpen, onClose, filters, onFilterChange }: FilterSidebarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'orientation', 'colors']);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/gallery');
    }
    onClose();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const toggleColor = (colorId: string) => {
    const newColors = filters.colors.includes(colorId)
      ? filters.colors.filter(c => c !== colorId)
      : [...filters.colors, colorId];
    onFilterChange({ ...filters, colors: newColors });
  };

  const clearFilters = () => {
    onFilterChange({ categories: [], orientation: 'all', colors: [], sort: 'recent' });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.colors.length > 0 || filters.orientation !== 'all';

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/10">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Filters</h3>
            <p className="text-xs text-muted-foreground">Refine your search</p>
          </div>
        </div>
        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images..."
              className="w-full h-11 pl-10 pr-4 bg-secondary/50 rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-secondary transition-all"
            />
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        {/* Categories */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full p-5 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              Categories
              {filters.categories.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {filters.categories.length}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSections.includes('categories') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('categories') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                        filters.categories.includes(category.id)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/50 text-foreground'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="flex-1 text-sm text-left">{category.name}</span>
                      <span className="text-xs text-muted-foreground">{category.count}</span>
                      {filters.categories.includes(category.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Orientation */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection('orientation')}
            className="flex items-center justify-between w-full p-5 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
          >
            <span>Orientation</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSections.includes('orientation') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('orientation') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                  {orientations.map((orientation) => (
                    <button
                      key={orientation.id}
                      onClick={() => onFilterChange({ ...filters, orientation: orientation.id })}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        filters.orientation === orientation.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-foreground hover:bg-secondary'
                      }`}
                    >
                      {orientation.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Colors */}
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection('colors')}
            className="flex items-center justify-between w-full p-5 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              Colors
              {filters.colors.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                  {filters.colors.length}
                </span>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSections.includes('colors') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('colors') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => toggleColor(color.id)}
                      title={color.name}
                      className={`relative w-9 h-9 rounded-full transition-all hover:scale-110 ${
                        filters.colors.includes(color.id)
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: color.color }}
                    >
                      {filters.colors.includes(color.id) && (
                        <Check className={`absolute inset-0 m-auto h-4 w-4 ${
                          color.id === 'white' || color.id === 'yellow' ? 'text-gray-800' : 'text-white'
                        }`} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div>
          <button
            onClick={() => toggleSection('sort')}
            className="flex items-center justify-between w-full p-5 text-sm font-semibold text-foreground hover:bg-secondary/30 transition-colors"
          >
            <span>Sort By</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedSections.includes('sort') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('sort') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => onFilterChange({ ...filters, sort: option.id })}
                      className={`flex items-center justify-between w-full p-3 rounded-xl text-sm transition-all ${
                        filters.sort === option.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/50 text-foreground'
                      }`}
                    >
                      <span>{option.name}</span>
                      {filters.sort === option.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="p-5 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
            onClick={clearFilters}
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0 bg-card/50 backdrop-blur-sm border-r border-border h-[calc(100vh-80px)] sticky top-20 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-md z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[85vh] overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Filters</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="max-h-[calc(85vh-60px)] overflow-y-auto">
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FilterSidebar;
