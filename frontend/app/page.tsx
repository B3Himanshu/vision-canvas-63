import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCarousel from '@/components/home/FeaturedCarousel';
import StatsSection from '@/components/home/StatsSection';
import CategoryGrid from '@/components/home/CategoryGrid';
import CTASection from '@/components/home/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturedCarousel />
        <StatsSection />
        <CategoryGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
