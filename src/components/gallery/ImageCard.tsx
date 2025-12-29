import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Eye } from 'lucide-react';

interface ImageCardProps {
  image: {
    id: number;
    url: string;
    title: string;
    author: string;
    downloads: number;
    height: number;
  };
  onClick: () => void;
}

const ImageCard = ({ image, onClick }: ImageCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
  };

  return (
    <motion.div
      className="group relative rounded-xl overflow-hidden cursor-pointer mb-4"
      style={{ breakInside: 'avoid' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
    >
      {/* Skeleton */}
      {!isLoaded && (
        <div 
          className="w-full bg-secondary animate-pulse rounded-xl"
          style={{ paddingBottom: `${(image.height / 300) * 100}%` }}
        />
      )}

      {/* Image */}
      <img
        src={image.url}
        alt={image.title}
        className={`w-full h-auto transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 image-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Top actions */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <motion.button
            className={`p-2 rounded-full glass-light transition-colors ${
              isLiked ? 'text-destructive' : 'text-foreground'
            }`}
            onClick={handleLike}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-1">
            {image.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70 text-xs">@{image.author}</span>
            <div className="flex items-center gap-3">
              <span className="text-foreground/70 text-xs flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {Math.floor(image.downloads * 1.5).toLocaleString()}
              </span>
              <motion.button
                className="p-2 rounded-full glass-light text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={handleDownload}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageCard;
