import logoImage from '@/assets/logo.jpeg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth-optimized';
import { Search, Shield, ShoppingCart, User, PlusCircle, LogOut, Menu } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = profile?.displayName || user?.email || 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [profile?.displayName, user?.email]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 dark:bg-slate-950/90 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 items-center justify-between gap-2 py-2 sm:gap-4 sm:py-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <img src={logoImage} alt="VCONECT" className="h-8 w-8 sm:h-9 sm:w-9 rounded-md object-cover" />
            <span className="text-base sm:text-xl font-black tracking-widest text-primary uppercase">VCONECT</span>
          </button>

          <form
            className="hidden lg:flex flex-1 max-w-xl"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const query = String(formData.get('search') || '').trim();
              if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="search" placeholder="Search products, houses, transport..." className="pl-11" />
            </div>
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" className="hidden md:inline-flex" onClick={() => navigate('/sell')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Sell
            </Button>

            <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => navigate('/account?tab=messages')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>

            {loading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                {profile?.userType === 'admin' && (
                  <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                    <Shield className="h-5 w-5" />
                  </Button>
                )}
                <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/account')}>
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.displayName || 'User'} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  {profile?.displayName || 'Account'}
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button className="hidden sm:inline-flex" onClick={() => navigate('/auth')}>
                <User className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            )}

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => navigate('/search')}>
              <Menu className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate('/auth')}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
