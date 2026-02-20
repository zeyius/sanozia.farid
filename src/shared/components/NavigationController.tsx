import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { logger, loggerContexts } from '../utils/logger';

export function NavigationController() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    logger.debug('NavigationController:', {
      path: location.pathname,
      hasUser: !!user,
      loading,
      userEmail: user?.email,
      isProfileComplete: user?.profile?.is_profile_complete
    }, loggerContexts.NAVIGATION);

    // Ne pas rediriger pendant le chargement
    if (loading) {
      logger.debug('Chargement en cours, pas de redirection', undefined, loggerContexts.NAVIGATION);
      return;
    }

    // Utilisateur connecté
    if (user) {
      logger.debug('Utilisateur connecté, vérification du profil', undefined, loggerContexts.NAVIGATION);
      
      // Si profil incomplet et pas sur onboarding, rediriger
      // Si pas de profil du tout (undefined), considérer comme incomplet
      const isProfileComplete = user.profile?.is_profile_complete === true;
      if (!isProfileComplete && !location.pathname.startsWith('/onboarding')) {
        logger.info('Redirection: profil incomplet → onboarding', {
          hasProfile: !!user.profile,
          isComplete: user.profile?.is_profile_complete
        }, loggerContexts.NAVIGATION);
        navigate('/onboarding', { replace: true });
        return;
      }
      
      // Si profil complet et sur la racine ou pages auth, rediriger vers dashboard
      if (isProfileComplete && (location.pathname === '/' || location.pathname.startsWith('/auth'))) {
        logger.info('Redirection: profil complet → dashboard', undefined, loggerContexts.NAVIGATION);
        navigate('/dashboard', { replace: true });
        return;
      }
    } 
    // Utilisateur non connecté
    else {
      logger.debug('Utilisateur non connecté - redirection immédiate vers signin', undefined, loggerContexts.NAVIGATION);
      
      // Redirection immédiate vers signin pour tout utilisateur non connecté
      // sauf s'il est déjà sur une page d'auth
      if (!location.pathname.startsWith('/auth')) {
        logger.info('REDIRECTION FORCÉE: non connecté → signin', undefined, loggerContexts.NAVIGATION);
        navigate('/auth/signin', { replace: true });
        return;
      } else {
        logger.debug('Déjà sur page auth, pas de redirection', undefined, loggerContexts.NAVIGATION);
      }
    }

    logger.debug('Aucune redirection nécessaire', undefined, loggerContexts.NAVIGATION);
  }, [user, loading, location.pathname, navigate]);

  return null; // Ce composant ne rend rien
}
