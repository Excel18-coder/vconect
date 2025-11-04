import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import logoImage from "@/assets/logo.jpeg";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src={logoImage} 
                alt="VCONECT Logo" 
                className="w-12 h-12 object-contain rounded-lg bg-transparent"
                style={{ mixBlendMode: 'multiply' }}
              />
              <span className="text-xl font-bold text-blue-600">VCONECT</span>
            </div>
            <p className="text-muted-foreground">
              Kenya's leading digital marketplace connecting communities through technology, commerce, and innovation.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">About Us</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">How It Works</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Seller Guide</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Buyer Protection</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Help Center</a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categories</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Real Estate</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Transportation</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Marketplace</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Healthcare</a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Jobs & Careers</a>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold">Stay Connected</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@vconnect.co.ke</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+254 790609919</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Kirinyaga, Kenya</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Subscribe to our newsletter</p>
              <div className="flex space-x-2">
                <Input placeholder="Your email" className="text-sm" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
            <div>© 2025 V-MARKET. All rights reserved.</div>
            <div className="text-xs">Powered by CIPHER</div>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;