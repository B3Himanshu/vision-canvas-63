'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const categories = [
  { 
    name: 'Nature', 
    icon: '🌳', 
    count: '2.5K',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop',
    gradient: 'from-green-600/80 to-emerald-600/80'
  },
  { 
    name: 'Business', 
    icon: '💼', 
    count: '1.8K',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
    gradient: 'from-blue-600/80 to-indigo-600/80'
  },
  { 
    name: 'Travel', 
    icon: '✈️', 
    count: '3.2K',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&h=400&fit=crop',
    gradient: 'from-cyan-600/80 to-blue-600/80'
  },
  { 
    name: 'People', 
    icon: '👥', 
    count: '1.2K',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
    gradient: 'from-pink-600/80 to-rose-600/80'
  },
  { 
    name: 'Abstract', 
    icon: '🎨', 
    count: '890',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&h=400&fit=crop',
    gradient: 'from-purple-600/80 to-violet-600/80'
  },
  { 
    name: 'Food', 
    icon: '🍔', 
    count: '1.5K',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    gradient: 'from-orange-600/80 to-amber-600/80'
  },
  { 
    name: 'Technology', 
    icon: '💻', 
    count: '980',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    gradient: 'from-teal-600/80 to-cyan-600/80'
  },
  { 
    name: 'Architecture', 
    icon: '🏛️', 
    count: '1.1K',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop',
    gradient: 'from-yellow-600/80 to-amber-600/80'
  },
];

const CategoryGrid = () => {
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
            Browse by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find the perfect images for your project
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link 
                href={`/gallery?category=${category.name.toLowerCase()}`}
                className="block group"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden hover-3d">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} transition-opacity duration-300`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-4xl md:text-5xl mb-2">{category.icon}</span>
                    <h3 className="text-lg md:text-xl font-bold text-foreground">{category.name}</h3>
                    <p className="text-sm text-foreground/80">{category.count} images</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
