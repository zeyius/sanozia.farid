import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { useAuth } from '../../features/auth';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showHeader?: boolean;
  showBottomNav?: boolean;
  onBackClick?: () => void; // Custom back handler (e.g., for form confirmation)
}

export function Layout({ 
  children, 
  title, 
  showBackButton = false, 
  showHeader = true,
  showBottomNav = true,
  onBackClick
}: LayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Default back handler: navigate to dashboard
  const handleBackClick = onBackClick || (() => navigate('/dashboard'));
  
  // Show navigation only if user is logged in and has complete profile
  const shouldShowBottomNav = showBottomNav && user?.profile?.is_profile_complete;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#f6e6d6] to-[#f9eddf] ${showHeader ? 'pt-16' : ''} ${shouldShowBottomNav ? 'pb-20' : ''}`}>
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 bg-[#303d25] text-white p-4 shadow-lg z-40">
          <div className="container mx-auto max-w-lg flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Back to dashboard"
              >
                ←
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {title || 'Sanozia'}
              </h1>
            </div>
          </div>
        </header>
      )}
      
      <main className="container mx-auto px-4 py-6 max-w-lg">
        {children}
      </main>
      
      {shouldShowBottomNav && <BottomNavigation />}
    </div>
  );
}