import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const collections = [
  {
    id: 1,
    name: 'Nature Wonders',
    description: 'Breathtaking landscapes and wildlife',
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
    ],
  },
  {
    id: 2,
    name: 'Urban Life',
    description: 'City vibes and architecture',
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=400&h=300&fit=crop',
    ],
  },
  {
    id: 3,
    name: 'Abstract Art',
    description: 'Creative patterns and colors',
    images: [
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&h=300&fit=crop',
    ],
  },
];

const FeaturedCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % collections.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setActiveIndex(index);
  const goToPrev = () => setActiveIndex((prev) => (prev - 1 + collections.length) % collections.length);
  const goToNext = () => setActiveIndex((prev) => (prev + 1) % collections.length);

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Collections
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Curated sets of stunning images for your creative projects
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button variant="icon" size="icon" onClick={goToPrev}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="icon" size="icon" onClick={goToNext}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {collections.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex 
                      ? 'w-8 bg-primary' 
                      : 'bg-muted hover:bg-muted-foreground'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Carousel Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Collection Info */}
                <div className="lg:w-1/3 flex flex-col justify-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {collections[activeIndex].name}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {collections[activeIndex].description}
                  </p>
                  <Link to="/gallery">
                    <Button variant="gradient" className="gap-2">
                      Explore Collection
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Images Grid */}
                <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {collections[activeIndex].images.map((image, idx) => (
                    <motion.div
                      key={idx}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden hover-3d cursor-pointer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                    >
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 image-overlay opacity-0 hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
