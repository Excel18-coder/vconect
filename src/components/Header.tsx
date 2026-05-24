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
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-elegant py-2'
        : 'bg-transparent py-4'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="flex items-center space-x-3 transition-all hover:scale-105"
            >
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                <img
                  src={logoImage}
                  alt="VCONECT Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">VCONECT</span>
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
              className="relative w-full"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                name="search"
                type="text"
                placeholder="Search cars, property, services..."
                className="w-full pl-11 pr-4 h-11 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 h-11 border-blue-100 dark:border-blue-900 px-5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
              onClick={() => navigate('/post-ad')}
            >
              <PlusCircle className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-600">Sell Item</span>
            </Button>

            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block"></div>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900"
              onClick={() => navigate('/account?tab=messages')}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
            </Button>

            {loading ? (
              <div className="h-10 w-10 rounded-2xl bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 p-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={profile?.avatarUrl} alt={profile?.displayName || 'User'} />
                      <AvatarFallback className="rounded-none bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {getInitials(profile?.displayName || user.email || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl shadow-xl" align="end">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">
                        {profile?.displayName || 'Market Member'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/account')} className="rounded-xl p-3 cursor-pointer">
                    <User className="mr-3 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account?tab=listings')} className="rounded-xl p-3 cursor-pointer">
                    <ShoppingCart className="mr-3 h-4 w-4" />
                    <span>My Listings</span>
                  </DropdownMenuItem>
                  {profile?.userType === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="rounded-xl p-3 cursor-pointer text-blue-600">
                      <Shield className="mr-3 h-4 w-4" />
                      <span className="font-semibold">Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl p-3 cursor-pointer text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Sign In
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 w-11 rounded-2xl"
              onClick={() => navigate('/menu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
