import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

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
  { id: 'all', name: 'All', icon: '⬜' },
  { id: 'landscape', name: 'Landscape', icon: '🖼️' },
  { id: 'portrait', name: 'Portrait', icon: '📱' },
  { id: 'square', name: 'Square', icon: '⬜' },
];

const colors = [
  { id: 'red', color: 'bg-red-500' },
  { id: 'orange', color: 'bg-orange-500' },
  { id: 'yellow', color: 'bg-yellow-500' },
  { id: 'green', color: 'bg-green-500' },
  { id: 'blue', color: 'bg-blue-500' },
  { id: 'purple', color: 'bg-purple-500' },
  { id: 'pink', color: 'bg-pink-500' },
  { id: 'brown', color: 'bg-amber-700' },
  { id: 'black', color: 'bg-gray-900' },
  { id: 'white', color: 'bg-white' },
  { id: 'gray', color: 'bg-gray-500' },
  { id: 'teal', color: 'bg-teal-500' },
];

const sortOptions = [
  { id: 'recent', name: 'Recent' },
  { id: 'popular', name: 'Popular' },
  { id: 'downloads', name: 'Most Downloaded' },
  { id: 'random', name: 'Random' },
];

const FilterSidebar = ({ isOpen, onClose, filters, onFilterChange }: FilterSidebarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'orientation', 'colors', 'sort']);

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
      {/* Search */}
      <form onSubmit={handleSearch} className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search images..."
            className="w-full h-10 pl-10 pr-4 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </form>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Categories */}
        <div>
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground"
          >
            Categories
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('categories') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('categories') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={filters.categories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-lg">{category.icon}</span>
                    <span className="flex-1 text-sm text-foreground">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{category.count}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Orientation */}
        <div>
          <button
            onClick={() => toggleSection('orientation')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground"
          >
            Orientation
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('orientation') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('orientation') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {orientations.map((orientation) => (
                  <label
                    key={orientation.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="orientation"
                      checked={filters.orientation === orientation.id}
                      onChange={() => onFilterChange({ ...filters, orientation: orientation.id })}
                      className="w-4 h-4 text-primary bg-secondary border-border focus:ring-primary"
                    />
                    <span className="text-lg">{orientation.icon}</span>
                    <span className="text-sm text-foreground">{orientation.name}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Colors */}
        <div>
          <button
            onClick={() => toggleSection('colors')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground"
          >
            Colors
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('colors') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('colors') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-6 gap-2 pt-2 overflow-hidden"
              >
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => toggleColor(color.id)}
                    className={`w-8 h-8 rounded-full ${color.color} border-2 transition-all ${
                      filters.colors.includes(color.id)
                        ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'border-transparent hover:scale-110'
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div>
          <button
            onClick={() => toggleSection('sort')}
            className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground"
          >
            Sort By
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('sort') ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {expandedSections.includes('sort') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {sortOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="sort"
                      checked={filters.sort === option.id}
                      onChange={() => onFilterChange({ ...filters, sort: option.id })}
                      className="w-4 h-4 text-primary bg-secondary border-border focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{option.name}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 bg-card border-r border-border h-[calc(100vh-80px)] sticky top-20">
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
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Filters</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="max-h-[calc(80vh-60px)] overflow-y-auto">
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
