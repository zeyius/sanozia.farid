import React from 'react';
import { useAuth } from '../../features/auth';
import { NavigationController } from '../../shared/components/NavigationController';
import { ErrorDisplay } from '../../shared/components/ErrorDisplay';
import { Layout } from '../../shared/components/Layout';
import { AppRouter } from '../router';

/**
 * Layout principal de l'application
 * Gère l'état de chargement global et orchestre les composants principaux
 */
export function AppLayout() {
  const { loading } = useAuth();

  // Écran de chargement global
  if (loading) {
    return (
      <Layout showHeader={false} showBottomNav={false}>
        <div className="min-h-screen flex flex-col justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-[#e3c79f]/30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303d25] mx-auto mb-4"></div>
              <div className="text-[#303d25] mb-4">Chargement...</div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Layout principal avec navigation et routing
  return (
    <>
      <NavigationController />
      <ErrorDisplay />
      <AppRouter />
    </>
  );
}
