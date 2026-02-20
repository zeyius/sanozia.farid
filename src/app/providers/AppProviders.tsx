import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../../features/auth';
import { OnboardingProvider } from '../../features/onboarding';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Composant centralisé qui regroupe tous les providers globaux de l'application
 * - Router pour la navigation
 * - AuthProvider pour l'authentification
 * - OnboardingProvider pour le processus d'inscription (conditionnel)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Router>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Router>
  );
}
