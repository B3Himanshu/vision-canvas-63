import { Link } from 'react-router-dom';
import { Github, Twitter, Instagram, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">P</span>
              </div>
              <span className="text-xl font-bold text-foreground">PixelVault</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Free high-quality images for mobile & desktop. Always free, no limits.
            </p>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Browse Images</Link></li>
              <li><Link to="/gallery?sort=popular" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Popular</Link></li>
              <li><Link to="/gallery?sort=recent" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Recent</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Categories</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link to="/upload" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Upload</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Collections</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Favorites</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Settings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">License</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 PixelVault. All images are free to use.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-destructive fill-current" /> for creators
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
