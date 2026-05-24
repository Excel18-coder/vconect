import logoImage from '@/assets/logo.jpeg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth-optimized';
import { Bell, LogOut, Menu, Search, Shield, ShoppingCart, User, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
      : 'U';
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-2 shadow-sm'
        : 'bg-transparent py-4'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="flex items-center space-x-3 transition-opacity hover:opacity-80"
            >
              <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <img
                  src={logoImage}
                  alt="VCONECT Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-black tracking-widest text-primary dark:text-white uppercase">VCONECT</span>
            </Link>
          </div>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden lg:flex items-center flex-1 max-w-xl mx-12">
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get('search') as string;
                if (query.trim()) {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                }
              }}
              className="relative w-full group"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" />
              <Input
                name="search"
                type="text"
                placeholder="Search premium inventory..."
                className="w-full pl-11 pr-4 h-12 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 focus:bg-white dark:focus:bg-slate-900 border-2 focus:border-primary/20 focus:ring-0 transition-all placeholder:text-slate-400 font-medium"
              />
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              className="hidden md:flex items-center gap-2 h-12 bg-accent hover:bg-accent/90 text-white px-6 rounded-lg font-bold shadow-sm transition-transform active:scale-95"
              onClick={() => navigate('/sell')}
            >
              <PlusCircle className="h-4 w-4" />
              <span>List Property</span>
            </Button>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-12 w-12 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
              onClick={() => navigate('/account?tab=messages')}
            >
              <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-accent rounded-full border-2 border-white dark:border-slate-950" />
            </Button>

            {loading ? (
              <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 p-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 transition-transform hover:scale-105 active:scale-95">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={profile?.avatarUrl} alt={profile?.displayName || 'User'} />
                      <AvatarFallback className="rounded-none bg-primary text-white text-xs font-black">
                        {getInitials(profile?.displayName || user.email || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-3 p-2 rounded-xl shadow-premium border-slate-100 dark:border-slate-800" align="end">
                  <DropdownMenuLabel className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-black leading-none text-primary dark:text-white uppercase tracking-wider">
                        {profile?.displayName || 'PLATINUM MEMBER'}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')} className="rounded-lg p-3 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 transition-colors">
                    <User className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">Account Strategy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=listings')} className="rounded-lg p-3 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 transition-colors">
                    <ShoppingCart className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">Portfolio</span>
                  </DropdownMenuItem>
                  {profile?.userType === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-lg p-3 cursor-pointer text-accent focus:bg-accent/5">
                      <Shield className="mr-3 h-4 w-4" />
                      <span className="font-black italic">EXECUTIVE PANEL</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg p-3 cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-bold">Terminate Session</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="h-12 px-8 rounded-lg bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-sm transition-transform active:scale-95"
              >
                Sign In
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-12 w-12 rounded-lg"
              onClick={() => navigate('/menu')}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
