import { Button } from '@/components/ui/button';
import { Car, Home, PlayCircle, ShoppingBag, PlusCircle, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const mainCategories = [
    { name: 'Housing', icon: Home, path: '/category/housing' },
    { name: 'Vehicles', icon: Car, path: '/category/transport' },
    { name: 'Market', icon: ShoppingBag, path: '/category/market' },
    {
      name: 'Entertainment',
      icon: PlayCircle,
      path: '/category/entertainment',
    },
  ];

  return (
    <nav className="sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 transition-all duration-500">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-2">
            {mainCategories.map(category => {
              const Icon = category.icon;
              const isActive = location.pathname === category.path;
              return (
                <Button
                  key={category.path}
                  variant="ghost"
                  size="sm"
                  className={`relative flex items-center space-x-2 whitespace-nowrap rounded-xl px-4 h-10 transition-all duration-300 ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  asChild
                >
                  <Link to={category.path}>
                    <Icon className={`h-4 w-4 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-sm tracking-tight">{category.name}</span>
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3 ml-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              asChild
            >
              <Link to="/sell" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Sell Items
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-xl h-10 px-5 font-bold italic tracking-tight shadow-lg shadow-slate-950/10 hover:scale-[1.03] active:scale-95 transition-all"
              asChild
            >
              <Link to="/post-ad" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4 opacity-70" />
                Post Ad
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
