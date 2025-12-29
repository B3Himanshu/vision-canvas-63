import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ChevronDown, Sparkles, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'Nature', icon: '🌳', color: 'bg-category-nature' },
  { name: 'Business', icon: '💼', color: 'bg-category-business' },
  { name: 'Travel', icon: '✈️', color: 'bg-category-travel' },
  { name: 'People', icon: '👥', color: 'bg-category-people' },
  { name: 'Abstract', icon: '🎨', color: 'bg-category-abstract' },
  { name: 'Food', icon: '🍔', color: 'bg-category-food' },
];

const floatingImages = [
  { id: 1, rotate: -8, delay: 0, x: -60, y: -20 },
  { id: 2, rotate: 5, delay: 0.5, x: 40, y: 30 },
  { id: 3, rotate: -3, delay: 1, x: -30, y: 60 },
  { id: 4, rotate: 8, delay: 1.5, x: 50, y: -40 },
  { id: 5, rotate: -5, delay: 0.8, x: -50, y: 40 },
  { id: 6, rotate: 4, delay: 1.2, x: 30, y: -30 },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/gallery');
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/gallery?category=${category.toLowerCase()}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-bg bg-hero-pattern">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />
      
      {/* Floating 3D image cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingImages.map((img, index) => (
          <motion.div
            key={img.id}
            className="absolute hidden lg:block"
            style={{
              left: `${15 + (index % 3) * 30}%`,
              top: `${20 + Math.floor(index / 3) * 40}%`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 0.7, 
              scale: 1,
              x: [img.x, img.x + 10, img.x],
              y: [img.y, img.y - 15, img.y],
              rotateX: [-5, 5, -5],
              rotateY: [img.rotate, img.rotate + 5, img.rotate],
            }}
            transition={{
              delay: img.delay,
              duration: 6 + index,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div 
              className="w-32 h-44 rounded-2xl shadow-card-hover overflow-hidden transform-gpu"
              style={{ transform: `rotate(${img.rotate}deg)` }}
            >
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Particle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">100% Free Forever</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Stunning Images for{' '}
            <span className="gradient-text">Every Screen</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Download free high-quality images optimized for mobile & desktop.
            No limits, no watermarks, no premium tiers.
          </motion.p>

          {/* Search Bar */}
          <motion.form 
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="relative glass rounded-2xl p-2 shadow-glass hover:shadow-glow transition-shadow duration-300">
              <div className="flex items-center gap-3">
                <Search className="h-6 w-6 text-muted-foreground ml-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images, categories, tags..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-lg py-4 focus:outline-none"
                />
                <Button type="submit" variant="gradient" size="lg" className="rounded-xl">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.form>

          {/* Category Pills */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className="category-pill"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className="flex items-center justify-center gap-8 md:gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">10K+ Images</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-5 w-5 text-accent" />
              <span className="text-sm">Free Worldwide</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-5 w-5 text-category-people" />
              <span className="text-sm">No Limits</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="h-8 w-8" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
