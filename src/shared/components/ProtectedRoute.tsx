import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { logger, loggerContexts } from '../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  logger.debug('ProtectedRoute:', { hasUser: !!user, loading }, loggerContexts.AUTH);

  // SUPPRESSION de l'écran de chargement redondant
  // Le chargement est géré par App.tsx/LandingPage
  
  if (!user) {
    logger.info('ProtectedRoute: Pas d\'utilisateur, redirection vers signin', undefined, loggerContexts.AUTH);
    return <Navigate to="/auth/signin" replace />;
  }

  logger.debug('ProtectedRoute: Utilisateur connecté, affichage du contenu', undefined, loggerContexts.AUTH);
  return <>{children}</>;
}