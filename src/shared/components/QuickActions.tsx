import React from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'meal',
    title: 'Ajouter un repas',
    description: 'Enregistrer votre dernier repas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    href: '/meals/add',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'stool',
    title: 'Selles',
    description: 'Enregistrer une selle',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    href: '/stools/add',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'symptom',
    title: 'Ressenti',
    description: 'Scan du jour',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    href: '/symptom',
    color: 'from-orange-400 to-orange-600'
  }
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#303d25]">Actions rapides</h3>
      <div className="grid gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.href)}
            className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-[#e3c79f]/30 hover:border-[#b36b43]/50 transition-all duration-200 hover:shadow-md text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[#303d25] group-hover:text-[#b36b43] transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-[#303d25]/60">
                  {action.description}
                </p>
              </div>
              <svg 
                className="w-5 h-5 text-[#303d25]/40 group-hover:text-[#b36b43] group-hover:translate-x-1 transition-all" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
