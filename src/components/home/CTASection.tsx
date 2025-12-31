import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      
      {/* Floating elements */}
      <motion.div
        className="absolute top-20 left-10 w-20 h-20 rounded-full bg-foreground/10 backdrop-blur-sm"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-foreground/10 backdrop-blur-sm"
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-foreground/5 backdrop-blur-sm"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative container mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/10 backdrop-blur-sm mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium text-foreground">Join Our Community</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Discover Amazing Imagery
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto">
            Explore a curated collection of high-quality images from creators worldwide. 
            Be part of a community that believes in free, beautiful imagery for everyone.
          </p>

          <Link to="/gallery">
            <Button 
              variant="hero" 
              size="xl" 
              className="gap-2"
            >
              Explore Gallery
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
