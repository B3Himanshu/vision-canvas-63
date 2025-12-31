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

// Large floating background cards positioned around edges
const backgroundCards = [
  // Left side cards
  { id: 1, left: '3%', top: '15%', width: 180, height: 240, rotate: -12, delay: 0 },
  { id: 2, left: '8%', top: '55%', width: 140, height: 200, rotate: 8, delay: 0.3 },
  { id: 3, left: '15%', top: '75%', width: 120, height: 160, rotate: -5, delay: 0.6 },
  // Right side cards
  { id: 4, right: '3%', top: '20%', width: 160, height: 220, rotate: 10, delay: 0.2 },
  { id: 5, right: '10%', top: '50%', width: 180, height: 260, rotate: -8, delay: 0.5 },
  { id: 6, right: '5%', top: '80%', width: 130, height: 180, rotate: 15, delay: 0.8 },
  // Top center cards (smaller, more subtle)
  { id: 7, left: '35%', top: '5%', width: 100, height: 140, rotate: -18, delay: 0.4 },
  { id: 8, right: '30%', top: '8%', width: 90, height: 120, rotate: 12, delay: 0.7 },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?q=${encodeURIComponent(searchQuery)}`);
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
      
      {/* Large floating background cards */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {backgroundCards.map((card) => (
          <motion.div
            key={card.id}
            className="absolute hidden md:block"
            style={{
              left: card.left,
              right: card.right,
              top: card.top,
              width: card.width,
              height: card.height,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -10, 0],
            }}
            transition={{
              delay: card.delay,
              duration: 5 + card.id * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div 
              className="w-full h-full rounded-3xl overflow-hidden transform-gpu"
              style={{ 
                transform: `rotate(${card.rotate}deg)`,
                background: 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Inner gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              {/* Subtle shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
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
