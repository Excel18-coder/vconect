import { Button } from '@/components/ui/button';
import { Car, Home, PlayCircle, ShoppingBag, PlusCircle, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const categories = [
  { name: 'Housing', icon: Home, path: '/category/housing' },
  { name: 'Vehicles', icon: Car, path: '/category/transport' },
  { name: 'Market', icon: ShoppingBag, path: '/category/market' },
  { name: 'Entertainment', icon: PlayCircle, path: '/category/entertainment' },
];

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="sticky top-16 z-40 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-2 overflow-x-auto sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            {categories.map(({ name, icon: Icon, path }) => {
              const active = location.pathname === path;
              return (
                <Button key={path} variant={active ? 'default' : 'ghost'} size="sm" asChild className="rounded-full whitespace-nowrap px-3 sm:px-4">
                  <Link to={path} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{name}</span>
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <Link to="/sell" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Sell Items
              </Link>
            </Button>
            <Button size="sm" asChild className="rounded-full px-4">
              <Link to="/post-ad" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Post Product
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
