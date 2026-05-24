import logoImage from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                <img
                  src={logoImage}
                  alt="VCONECT Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">VCONECT</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Empowering Kenya's digital future by connecting buyers and sellers
              through a premium, secure, and intuitive marketplace experience.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-blue-600 hover:text-white transition-all">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-sky-500 hover:text-white transition-all">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-pink-600 hover:text-white transition-all">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Marketplace</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/category/housing" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  Real Estate
                </Link>
              </li>
              <li>
                <Link to="/category/transport" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  Transport
                </Link>
              </li>
              <li>
                <Link to="/category/market" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  General Store
                </Link>
              </li>
              <li>
                <Link to="/category/entertainment" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  <ArrowRight className="h-3 w-3 mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  Entertainment
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Support</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-blue-600 transition-colors flex items-center group">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">Get Updates</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to stay updated with the latest listings and community deals.
            </p>
            <div className="flex flex-col space-y-3">
              <Input
                placeholder="Email address"
                className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold">
                Subscribe
              </Button>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-3 text-blue-600" />
                <span>info@vconnect.co.ke</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-3 text-emerald-600" />
                <span>+254 790609919</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-200 dark:bg-slate-800" />

        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {currentYear} <span className="font-bold text-slate-900 dark:text-slate-100">VCONECT</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Built with excellence in <span className="font-bold text-red-600 uppercase tracking-widest">Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
