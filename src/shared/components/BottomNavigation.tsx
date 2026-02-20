import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Utensils, UtensilsCrossed, Toilet, Heart, History } from 'lucide-react';

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Accueil',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'meal',
      label: 'Conso',
      icon: UtensilsCrossed,
      path: '/meal'
    },
    {
      id: 'stool',
      label: 'Selles',
      icon: Toilet,
      path: '/stool'
    },
    {
      id: 'symptom',
      label: 'Ressenti',
      icon: Heart,
      path: '/symptom'
    },
    {
      id: 'history',
      label: 'Historique',
      icon: History,
      path: '/history'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e3c79f]/50 shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex justify-between items-center py-2 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                active
                  ? 'bg-[#303d25] text-white shadow-md'
                  : 'text-[#303d25]/70 hover:text-[#303d25] hover:bg-[#e3c79f]/20'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-xs font-medium leading-none truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}