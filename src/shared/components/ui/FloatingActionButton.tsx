/**
 * Floating Action Button (FAB)
 * Quick access to common actions
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils/helpers';
import { Heart, MessageCircle, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'Post Ad',
      onClick: () => navigate('/post-ad'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      onClick: () => navigate('/account?tab=messages'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Heart,
      label: 'Favorites',
      onClick: () => navigate('/account?tab=favorites'),
      color: 'bg-red-500 hover:bg-red-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      <div
        className={cn(
          'flex flex-col-reverse gap-3 mb-3 transition-all duration-300',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.label}
              className="flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="glass glass-border px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-lg">
                {action.label}
              </span>
              <Button
                size="icon"
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110',
                  action.color
                )}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110',
          'bg-gradient-to-r from-primary to-secondary',
          isOpen && 'rotate-45'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
      </Button>
    </div>
  );
}

export default FloatingActionButton;
