import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Download, X, Share2, Expand, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  image: {
    id: number;
    url: string;
    title: string;
    author: string;
    downloads: number;
    category: string;
    tags: string[];
  } | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const ImageModal = ({ image, onClose, onNavigate }: ImageModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [downloadType, setDownloadType] = useState<'mobile' | 'desktop' | null>(null);

  if (!image) return null;

  const handleDownload = (type: 'mobile' | 'desktop' | 'original') => {
    setDownloadType(type === 'original' ? null : type);
    // Simulate download
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}-${type}.jpg`;
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-y-auto"
        onClick={onClose}
      >
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-16 glass">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsLiked(!isLiked)}
              className={isLiked ? 'text-destructive' : ''}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {onNavigate && (
          <>
            <Button
              variant="glass"
              size="icon-lg"
              className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
              onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="glass"
              size="icon-lg"
              className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
              onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Content */}
        <div 
          className="pt-20 pb-8 px-4 md:px-8 min-h-screen flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image */}
          <motion.div 
            className="relative w-full max-w-5xl mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-card-hover bg-card">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                style={{ transform: `scale(${zoom})` }}
              />
              
              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setZoom(Math.max(1, zoom - 0.5))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button 
                  variant="glass" 
                  size="icon"
                  onClick={() => setZoom(Math.min(3, zoom + 0.5))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="glass" size="icon">
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div 
            className="w-full max-w-3xl glass rounded-2xl p-6 md:p-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Title & Meta */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {image.title}
              </h2>
              <p className="text-muted-foreground">
                By <span className="text-foreground font-medium">@{image.author}</span>
                {' · '}{image.downloads.toLocaleString()} downloads
              </p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button 
                variant="gradient" 
                size="lg" 
                className="gap-3 h-auto py-4 flex-col"
                onClick={() => handleDownload('mobile')}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-semibold">Download Mobile</span>
                </div>
                <span className="text-xs opacity-80">1080 × 1920 · JPG</span>
              </Button>
              <Button 
                variant="gradient" 
                size="lg" 
                className="gap-3 h-auto py-4 flex-col"
                onClick={() => handleDownload('desktop')}
              >
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  <span className="font-semibold">Download Desktop</span>
                </div>
                <span className="text-xs opacity-80">1920 × 1080 · JPG</span>
              </Button>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => handleDownload('original')}
            >
              <Download className="h-4 w-4" />
              Download Original · PNG · 3840 × 2160
            </Button>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;
