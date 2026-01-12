import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import StatsSection from '@/components/home/StatsSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import CTASection from '@/components/home/CTASection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelvault.com';

export const metadata: Metadata = {
  title: 'Free High-Quality Images - Download Thousands of Free Photos',
  description: 'Browse and download thousands of free high-quality images. Perfect for designers, developers, and content creators. Free stock photos, illustrations, and graphics with no attribution required.',
  keywords: ['free images', 'stock photos', 'free photos', 'royalty free images', 'free stock photos', 'download images'],
  openGraph: {
    title: 'PixelVault - Free High-Quality Images',
    description: 'Browse and download thousands of free high-quality images. Perfect for designers, developers, and content creators.',
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/placeholder.svg`,
        width: 1200,
        height: 630,
        alt: 'PixelVault - Free High-Quality Images',
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturedCarousel />
        <StatsSection />
        <CategoryGrid />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
