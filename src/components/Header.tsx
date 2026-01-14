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
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, Menu, Search, Shield, ShoppingCart, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 glass glass-border shadow-elegant animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="flex items-center space-x-3 transition-transform hover:scale-105 duration-300"
            >
              <img
                src={logoImage}
                alt="VCONECT Logo"
                className="w-12 h-12 object-contain rounded-lg bg-transparent"
                style={{ mixBlendMode: 'multiply' }}
              />
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">VCONECT</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                name="search"
                type="text"
                placeholder="Search for cars, houses, electronics..."
                className="w-full pl-10 pr-4 transition-all duration-300 focus:shadow-glow bg-white dark:bg-gray-900"
              />
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex relative transition-all duration-300 hover:scale-110"
              onClick={() => navigate('/account?tab=messages')}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex relative transition-all duration-300 hover:scale-110"
              onClick={() => navigate('/account?tab=favorites')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center">
                0
              </span>
            </Button>

            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatarUrl} alt={profile?.displayName || 'User'} />
                      <AvatarFallback>
                        {getInitials(profile?.displayName || user.email || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  {profile?.userType === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
                <Link to="/auth">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('search') as string;
              if (query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              name="search"
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4"
            />
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;
