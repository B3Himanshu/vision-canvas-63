'use client';

import { useEffect, useState, useRef } from 'react';
import React from 'react';
import Image from 'next/image';
import { decode } from 'blurhash';

interface BlurHashImageProps {
  src: string;
  blurhash: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  onLoad?: () => void;
  priority?: boolean;
  unoptimized?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * BlurHashImage Component
 * 
 * Shows BlurHash placeholder instantly (0ms), then fades to actual image when loaded.
 * Provides instant visual feedback while images are loading.
 */
export function BlurHashImage({
  src,
  blurhash,
  alt,
  width,
  height,
  className = '',
  fill,
  onLoad,
  priority = false,
  unoptimized = false,
  sizes,
  loading,
}: BlurHashImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);

  // Reset imageLoaded when src changes
  useEffect(() => {
    setImageLoaded(false);
  }, [src]);

  // Decode BlurHash to data URL
  useEffect(() => {
    if (!blurhash) return;

    try {
      const size = 32; // Small size for BlurHash (32x32 is optimal)
      const pixels = decode(blurhash, size, size);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(size, size);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
        setBlurDataUrl(canvas.toDataURL());
      }
    } catch (error) {
      console.error('Error decoding BlurHash:', error);
    }
  }, [blurhash]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // Check if image is already in browser cache (for instant display)
  // Use ref to track if we've already checked this src to prevent duplicate checks
  const checkedSrcRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!src || imageLoaded || checkedSrcRef.current === src) return;
    
    checkedSrcRef.current = src;
    
    // Check if image is already in browser cache
    // Use HTMLImageElement constructor explicitly to avoid conflict with Next.js Image component
    const img = document.createElement('img');
    
    // Preload image to check cache
    img.src = src;
    
    // If already loaded (cached), show immediately
    if (img.complete) {
      setImageLoaded(true);
      onLoad?.();
      return;
    }
    
    // Otherwise wait for load event
    const checkLoad = () => {
      setImageLoaded(true);
      onLoad?.();
    };
    img.onload = checkLoad;
    img.onerror = () => {
      // If image fails to load, still hide blurhash
      setTimeout(() => setImageLoaded(true), 100);
    };
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // If no BlurHash, just show regular image
  if (!blurhash || !blurDataUrl) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          onLoad={handleImageLoad}
          priority={priority}
          unoptimized={unoptimized}
          sizes={sizes}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={handleImageLoad}
        priority={priority}
        unoptimized={unoptimized}
        sizes={sizes}
      />
    );
  }

  // Show BlurHash placeholder with fade transition to actual image
  return (
    <div 
      className={`relative ${fill ? 'w-full h-full' : ''}`} 
      style={fill ? undefined : { width, height }}
    >
      {/* BlurHash Placeholder - Behind the image, fades out when image loads */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-in-out"
        style={{
          opacity: imageLoaded ? 0 : 1,
          zIndex: 1,
          backgroundImage: `url(${blurDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)', // Slight scale to hide blur edges
          pointerEvents: 'none', // Allow clicks to pass through
        }}
      />

      {/* Actual Image - Fades in when loaded, always on top */}
      <div
        className={fill ? 'absolute inset-0' : 'relative'}
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 300ms ease-in-out',
          zIndex: 2,
        }}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            className={className}
            onLoad={handleImageLoad}
            priority={priority}
            unoptimized={unoptimized}
            sizes={sizes}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            onLoad={handleImageLoad}
            priority={priority}
            unoptimized={unoptimized}
            sizes={sizes}
          />
        )}
      </div>
    </div>
  );
}
