import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 pt-12 pb-8 sm:pt-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-black tracking-tight text-primary">VCONECT</h3>
            <p className="text-sm text-muted-foreground">
              Kenya's marketplace for fast, secure buying and selling across transport, housing, and more.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="icon" className="rounded-full"><Facebook className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-full"><Twitter className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-full"><Instagram className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-full"><Linkedin className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest">Marketplace</h4>
            <div className="space-y-2 text-sm">
              <Link className="block text-muted-foreground hover:text-primary" to="/category/housing">Real Estate</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/category/transport">Transport</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/category/market">Marketplace</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/category/entertainment">Entertainment</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest">Support</h4>
            <div className="space-y-2 text-sm">
              <Link className="block text-muted-foreground hover:text-primary" to="/auth">Login</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/account">My Account</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/post-ad">Post Ad</Link>
              <Link className="block text-muted-foreground hover:text-primary" to="/sell">Sell</Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">Get updates on new listings and platform improvements.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Email address" className="bg-white dark:bg-slate-900" />
              <Button><ArrowRight className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" />support@vconect.co.ke</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" />+254 790 609 919</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />Nairobi, Kenya</div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p>© {currentYear} VCONECT. All rights reserved.</p>
          <p>Built for mobile-first marketplace usage in Kenya.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
