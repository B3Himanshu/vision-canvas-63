import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Download, X, Share2, Expand, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Monitor, Smartphone, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  const navigate = useNavigate();

  if (!image) return null;

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/gallery?image=${image.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleTagClick = (tag: string) => {
    onClose();
    navigate(`/gallery?q=${tag}`);
  };

  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'mobile' | 'desktop' | 'original') => {
    setIsDownloading(type);
    setDownloadType(type === 'original' ? null : type);
    
    try {
      // Fetch the image as a blob
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}-${type}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(null);
    }
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
            <Button variant="ghost" size="icon" onClick={handleShare}>
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
            className="w-full max-w-2xl bg-card rounded-2xl p-6 md:p-8 border border-border"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Title & Meta */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {image.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                By <span className="text-primary font-medium">@{image.author}</span>
                {' · '}{image.downloads.toLocaleString()} downloads
              </p>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                onClick={() => handleDownload('mobile')}
                disabled={isDownloading === 'mobile'}
                className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(262, 83%, 58%) 50%, hsl(330, 81%, 60%) 100%)',
                }}
              >
                <div className="flex items-center justify-center gap-2 text-white font-semibold mb-1">
                  {isDownloading === 'mobile' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  Download Mobile
                </div>
                <span className="text-white/70 text-xs">1080 × 1920 · JPG</span>
              </button>
              <button 
                onClick={() => handleDownload('desktop')}
                disabled={isDownloading === 'desktop'}
                className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(199, 89%, 48%) 50%, hsl(330, 81%, 60%) 100%)',
                }}
              >
                <div className="flex items-center justify-center gap-2 text-white font-semibold mb-1">
                  {isDownloading === 'desktop' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  Download Desktop
                </div>
                <span className="text-white/70 text-xs">1920 × 1080 · JPG</span>
              </button>
            </div>

            <button 
              onClick={() => handleDownload('original')}
              disabled={isDownloading === 'original'}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-70"
            >
              {isDownloading === 'original' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="text-sm">Download Original · PNG · 3840 × 2160</span>
            </button>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm text-muted-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                  >
                    #{tag}
                  </button>
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
