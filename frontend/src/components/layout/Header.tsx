'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Menu, X, Search, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { SignInModal } from '@/components/auth/SignInModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  
  // Use hooks - router is safe, pathname was unused so removed
  const router = useRouter();
  const { user, isAuthenticated, signOut, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gallery?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 glass border-b border-border/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base">P</span>
            </div>
            <span className="text-base font-bold text-foreground hidden sm:block">PixelVault</span>
          </Link>

          {/* Search Bar - Center, takes available space */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="flex items-center w-full h-10 bg-muted/40 rounded-lg border border-border/50 overflow-hidden">
              <Input
                type="text"
                placeholder="Search the perfect image, document or graphic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full px-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 text-sm"
              />
              <button 
                type="submit" 
                className="h-full px-4 bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <Search className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </form>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              href="/gallery" 
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium"
            >
              Explore
            </Link>
            <Link 
              href="/favorites" 
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium flex items-center gap-1.5"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Link>
            <Link 
              href="/gallery?category=nature" 
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium"
            >
              Categories
            </Link>
            <Link 
              href="/gallery?sort=popular" 
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all font-medium"
            >
              Popular
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 rounded-lg px-3 h-9">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.picture || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm font-medium">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="gradient" 
                size="sm" 
                className="gap-1.5 rounded-lg px-4 h-9"
                onClick={() => setShowSignInModal(true)}
                disabled={loading}
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 w-9"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for images..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-background/50 border-border/50 rounded-full"
                  />
                </div>
                <Button type="submit" variant="gradient" size="icon" className="rounded-full">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              
              <Link 
                href="/gallery" 
                className="text-foreground py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Explore
              </Link>
              <Link 
                href="/favorites" 
                className="text-foreground py-2 font-medium flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
              <Link 
                href="/gallery?category=nature" 
                className="text-foreground py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                href="/gallery?sort=popular" 
                className="text-foreground py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Popular
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.picture || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="gradient" 
                    className="w-full gap-2"
                    onClick={() => {
                      setShowSignInModal(true);
                      setIsMenuOpen(false);
                    }}
                    disabled={loading}
                  >
                    <User className="h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign-In Modal */}
      <SignInModal
        open={showSignInModal}
        onOpenChange={setShowSignInModal}
      />
    </header>
  );
};

export default Header;
