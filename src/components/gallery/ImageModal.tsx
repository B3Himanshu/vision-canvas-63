import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Download, X, Share2, Expand, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Monitor, Smartphone, Loader2, Image, Palette, Shapes } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
    type?: 'photo' | 'illustration' | 'icon';
  } | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

// Generate recommended images based on seed
const generateRecommendedImages = (currentId: number, count: number = 8) => {
  return Array.from({ length: count }, (_, i) => ({
    id: currentId + 100 + i,
    url: `https://picsum.photos/seed/${currentId + 100 + i}/400/300`,
    title: ['Mountain Vista', 'Ocean Dreams', 'City Lights', 'Forest Path', 'Desert Sun', 'Aurora Night', 'Coastal Breeze', 'Valley Mist'][i % 8],
    author: ['alex', 'maria', 'john', 'emma', 'david', 'sarah', 'mike', 'lisa'][i % 8],
    downloads: Math.floor(Math.random() * 5000) + 500,
  }));
};

const ImageModal = ({ image, onClose, onNavigate }: ImageModalProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const navigate = useNavigate();

  const recommendedImages = useMemo(() => 
    image ? generateRecommendedImages(image.id) : [], 
    [image?.id]
  );

  if (!image) return null;

  const imageType = image.type || 'photo';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/gallery?image=${image.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = async (format: string, dimensions: string) => {
    setIsDownloading(format);
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = imageType === 'illustration' ? 'svg' : imageType === 'icon' ? 'png' : 'jpg';
      link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}-${format}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${format} format successfully!`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleRecommendedClick = (recImage: typeof recommendedImages[0]) => {
    toast.info(`Opening: ${recImage.title}`);
  };

  // Get type-specific icon and label
  const getTypeInfo = () => {
    switch (imageType) {
      case 'illustration':
        return { icon: Palette, label: 'Illustration', color: 'text-purple-500' };
      case 'icon':
        return { icon: Shapes, label: 'Icon', color: 'text-blue-500' };
      default:
        return { icon: Image, label: 'Photo', color: 'text-green-500' };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;

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
              
              {/* Type Badge */}
              <div className="absolute top-4 left-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass ${typeInfo.color}`}>
                  <TypeIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{typeInfo.label}</span>
                </div>
              </div>
              
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

          {/* Info Panel with Download */}
          <motion.div 
            className="w-full max-w-2xl bg-card rounded-2xl p-6 md:p-8 border border-border"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Title & Meta with Image Preview */}
            <div className="flex gap-4 mb-6">
              {/* Thumbnail Preview */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shadow-lg">
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 truncate">
                  {image.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  By <span className="text-primary font-medium">@{image.author}</span>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {image.downloads.toLocaleString()} downloads · {image.category}
                </p>
              </div>
            </div>

            {/* Download Section - 3 Buttons */}
            <div className="space-y-4">
              {/* Section Title */}
              <div className="text-sm text-muted-foreground">
                Download Formats
              </div>

              {/* Three Download Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* 16:9 Landscape */}
                <button 
                  onClick={() => handleDownload('16x9', '1920x1080')}
                  disabled={isDownloading === '16x9'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(262, 83%, 58%) 100%)',
                  }}
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === '16x9' ? 'Downloading...' : '16:9'}
                  </div>
                  <span className="text-white/70 text-xs">1920 × 1080</span>
                </button>

                {/* 9:16 Portrait */}
                <button 
                  onClick={() => handleDownload('9x16', '1080x1920')}
                  disabled={isDownloading === '9x16'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(330, 81%, 60%) 100%)',
                  }}
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === '9x16' ? 'Downloading...' : '9:16'}
                  </div>
                  <span className="text-white/70 text-xs">1080 × 1920</span>
                </button>

                {/* Original */}
                <button 
                  onClick={() => handleDownload('original', 'original')}
                  disabled={isDownloading === 'original'}
                  className="relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, hsl(330, 81%, 60%) 0%, hsl(199, 89%, 48%) 100%)',
                  }}
                >
                  <div className="text-white font-semibold mb-1">
                    {isDownloading === 'original' ? 'Downloading...' : 'Original'}
                  </div>
                  <span className="text-white/70 text-xs">Full Resolution</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm text-muted-foreground mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <Link 
                    key={tag}
                    to={`/tag/${tag}`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recommended Images Section */}
          <motion.div 
            className="w-full max-w-5xl mt-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                You might also like
              </h3>
              <button 
                onClick={() => { onClose(); navigate('/gallery'); }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View all →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendedImages.map((recImage, index) => (
                <motion.div
                  key={recImage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  onClick={() => handleRecommendedClick(recImage)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <img 
                      src={recImage.url}
                      alt={recImage.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white font-medium text-sm truncate">
                          {recImage.title}
                        </p>
                        <p className="text-white/70 text-xs">
                          @{recImage.author}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Related by Category */}
          <motion.div 
            className="w-full max-w-5xl mt-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                More in {image.category}
              </h3>
              <button 
                onClick={() => { onClose(); navigate(`/gallery?category=${image.category}`); }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Explore {image.category} →
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }, (_, i) => ({
                id: image.id + 200 + i,
                url: `https://picsum.photos/seed/${image.id + 200 + i}/300/200`,
                title: `${image.category} ${i + 1}`,
              })).map((relImage, index) => (
                <motion.div
                  key={relImage.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                    <img 
                      src={relImage.url}
                      alt={relImage.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;
