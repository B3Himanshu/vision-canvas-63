'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, Grid3X3, LayoutList } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ImageCard from '@/components/gallery/ImageCard';
import ImageModal from '@/components/gallery/ImageModal';
import { Button } from '@/components/ui/button';

// Generate mock images for a tag
const generateTagImages = (tag: string, count: number = 24) => {
  const baseSeed = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: count }, (_, i) => ({
    id: baseSeed + i,
    url: `https://picsum.photos/seed/${baseSeed + i}/600/${400 + (i % 3) * 100}`,
    title: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Image ${i + 1}`,
    author: ['alex', 'maria', 'john', 'emma', 'david', 'sarah', 'mike', 'lisa'][i % 8],
    downloads: Math.floor(Math.random() * 10000) + 500,
    height: 400 + (i % 3) * 100,
    category: tag,
    tags: [tag, 'trending', 'popular', 'hd'],
    type: i % 5 === 0 ? 'illustration' : i % 7 === 0 ? 'icon' : 'photo' as 'photo' | 'illustration' | 'icon',
  }));
};

// Related tags
const getRelatedTags = (tag: string) => {
  const allTags: Record<string, string[]> = {
    business: ['office', 'finance', 'corporate', 'marketing', 'meeting', 'teamwork'],
    office: ['business', 'workspace', 'desk', 'corporate', 'computer', 'meeting'],
    finance: ['business', 'money', 'banking', 'investment', 'charts', 'growth'],
    marketing: ['business', 'digital', 'advertising', 'social', 'branding', 'strategy'],
    technology: ['computer', 'digital', 'innovation', 'software', 'coding', 'startup'],
    corporate: ['business', 'office', 'professional', 'team', 'meeting', 'suit'],
    nature: ['landscape', 'forest', 'mountains', 'ocean', 'wildlife', 'sunset'],
    travel: ['adventure', 'vacation', 'destination', 'explore', 'journey', 'tourism'],
    people: ['portrait', 'lifestyle', 'family', 'friends', 'community', 'diversity'],
    abstract: ['art', 'pattern', 'geometric', 'colorful', 'texture', 'creative'],
    food: ['cuisine', 'healthy', 'cooking', 'restaurant', 'delicious', 'gourmet'],
    architecture: ['building', 'design', 'modern', 'urban', 'interior', 'structure'],
  };
  return allTags[tag.toLowerCase()] || ['trending', 'popular', 'featured', 'new', 'hd'];
};

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  const tagName = params.tagName as string;
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  
  const tag = tagName || 'business';
  const images = generateTagImages(tag);
  const relatedTags = getRelatedTags(tag);

  // Redirect to gallery with tag filter
  useEffect(() => {
    if (tagName) {
      router.replace(`/gallery?tags=${encodeURIComponent(tagName)}`);
    }
  }, [tagName, router]);

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
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 gradient-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Back Link */}
            <Link 
              href="/gallery" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Gallery
            </Link>
            
            {/* Tag Title */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <Tag className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground capitalize">
                {tag}
              </h1>
            </div>
            
            <p className="text-muted-foreground text-lg mb-8">
              {images.length} high-quality images tagged with "{tag}"
            </p>

            {/* Related Tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {relatedTags.map((relatedTag) => (
                <Link
                  key={relatedTag}
                  href={`/gallery?tags=${encodeURIComponent(relatedTag)}`}
                  className="px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground text-sm transition-colors"
                >
                  #{relatedTag}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {images.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('masonry')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div 
          className={viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'columns-2 md:columns-3 lg:columns-4 gap-4'
          }
        >
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ImageCard
                image={image}
                onClick={() => setSelectedImage(image)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
