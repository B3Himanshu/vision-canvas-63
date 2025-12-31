import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Download, Eye, Bookmark } from 'lucide-react';

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
  const [isSaved, setIsSaved] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
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
      className="group relative rounded-2xl overflow-hidden cursor-pointer mb-4 bg-secondary/30"
      style={{ breakInside: 'avoid' }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Skeleton */}
      {!isLoaded && (
        <div 
          className="w-full bg-secondary animate-pulse rounded-2xl"
          style={{ paddingBottom: `${(image.height / 300) * 100}%` }}
        />
      )}

      {/* Image */}
      <img
        src={image.url}
        alt={image.title}
        className={`w-full h-auto transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} group-hover:scale-105`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />

      {/* Top Actions - Always slightly visible, more on hover */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
            isSaved 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-background/60 text-foreground hover:bg-background/80'
          }`}
          onClick={handleSave}
          whileTap={{ scale: 0.9 }}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
        </motion.button>
        <motion.button
          className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
            isLiked 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-background/60 text-foreground hover:bg-background/80'
          }`}
          onClick={handleLike}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>

      {/* Bottom Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Title & Author */}
        <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-1">
          {image.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${image.author}`}
                alt={image.author}
                className="w-full h-full"
              />
            </div>
            <span className="text-muted-foreground text-xs">@{image.author}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {Math.floor(image.downloads * 1.5).toLocaleString()}
            </span>
            <motion.button
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              onClick={handleDownload}
              whileTap={{ scale: 0.9 }}
            >
              <Download className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Stats Badge */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background/60 backdrop-blur-md text-xs text-foreground">
          <Download className="h-3 w-3" />
          {image.downloads.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
};

export default ImageCard;
