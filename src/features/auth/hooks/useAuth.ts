import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';
import { type AuthUser } from '../../../shared/types';
import { supabase } from '../../../lib/supabase';
import { errorService, ErrorType } from '../../../shared/services/errorService';
import { logger, loggerContexts } from '../../../shared/utils/logger';
import type { Subscription } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logger.debug('Initialisation authentification', undefined, loggerContexts.AUTH);
    
    // Vérifier l'utilisateur actuel au démarrage
    const checkCurrentUser = async () => {
      if (!supabase) {
        logger.warn('Supabase non configuré', undefined, loggerContexts.AUTH);
        setLoading(false);
        return;
      }
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          logger.debug('Pas d\'utilisateur connecté:', error.message, loggerContexts.AUTH);
          setUser(null);
        } else if (user) {
          logger.debug('Utilisateur connecté détecté:', { userId: user.id }, loggerContexts.AUTH);
          const fullUser = await authService.getCurrentUser();
          setUser(fullUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        logger.error('Erreur vérification utilisateur:', err, loggerContexts.AUTH);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkCurrentUser();
    
    // Ajouter l'écoute des changements d'authentification
    let subscription: Subscription | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        logger.debug('Changement auth détecté:', { event, userEmail: session?.user?.email }, loggerContexts.AUTH);
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          logger.info('Déconnexion détectée via onAuthStateChange', undefined, loggerContexts.AUTH);
          setUser(null);
          setLoading(false); // S'assurer que loading est à false
        } else if (event === 'SIGNED_IN' && session?.user) {
          logger.info('Connexion détectée via onAuthStateChange:', { userEmail: session.user.email }, loggerContexts.AUTH);
          // Récupérer le profil complet
          const fetchUserProfile = async () => {
            try {
              const fullUser = await authService.getCurrentUser();
              if (fullUser) {
                logger.debug('Profil récupéré:', {
                  userId: session.user.id,
                  email: session.user.email,
                  isComplete: fullUser.profile?.is_profile_complete
                }, loggerContexts.AUTH);
                setUser(fullUser);
              }
            } catch (error) {
              errorService.handleError(
                ErrorType.AUTH_PROFILE_FETCH_FAILED,
                error as Error,
                { context: 'onAuthStateChange' }
              );
              setUser({
                ...session.user,
                profile: undefined
              });
            }
          };
          fetchUserProfile();
        }
      });
      subscription = data.subscription;
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    logger.info('Tentative d\'inscription:', { email }, loggerContexts.AUTH);
    setLoading(true);
    try {
      await authService.signUp(email, password);
      logger.info('Inscription réussie:', { email }, loggerContexts.AUTH);
      
      // Récupérer immédiatement l'utilisateur après inscription
      try {
        const fullUser = await authService.getCurrentUser();
        if (fullUser) {
          logger.debug('Profil récupéré après signup:', {
            userId: fullUser.id,
            email: fullUser.email,
            isComplete: fullUser.profile?.is_profile_complete
          }, loggerContexts.AUTH);
          setUser(fullUser);
        }
      } catch (profileError) {
        logger.warn('Impossible de récupérer le profil après signup:', profileError, loggerContexts.AUTH);
        // Continuer même si le profil n'est pas récupéré
      }
      
      setLoading(false);
    } catch (error) {
      logger.error('Erreur inscription:', error, loggerContexts.AUTH);
      setLoading(false);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    logger.info('Tentative de connexion:', { email }, loggerContexts.AUTH);
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        errorService.handleError(
          ErrorType.AUTH_SIGNIN_FAILED,
          error,
          { email, context: 'signIn' }
        );
        throw error;
      }
      
      logger.info('Connexion réussie:', { userEmail: data.user?.email }, loggerContexts.AUTH);
      // Récupérer le profil complet après connexion
      try {
        const fullUser = await authService.getCurrentUser();
        if (fullUser) {
          logger.debug('Profil récupéré après signin:', {
            userId: data.user.id,
            email: data.user.email,
            isComplete: fullUser.profile?.is_profile_complete
          }, loggerContexts.AUTH);
          setUser(fullUser);
        }
      } catch (profileError) {
        errorService.handleError(
          ErrorType.AUTH_PROFILE_FETCH_FAILED,
          profileError as Error,
          { email, context: 'signIn_profileFetch' }
        );
        setUser({
          ...data.user!,
          profile: undefined
        });
      }
      setLoading(false);
    } catch (error) {
      errorService.handleError(
        ErrorType.AUTH_SIGNIN_FAILED,
        error as Error,
        { email, context: 'signIn_exception' }
      );
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    logger.info('Début déconnexion', undefined, loggerContexts.AUTH);
    setLoading(true);
    try {
      await authService.signOut();
      logger.info('Déconnexion réussie', undefined, loggerContexts.AUTH);
      // Mettre à jour immédiatement l'état
      setUser(null);
      setLoading(false);
      logger.debug('État utilisateur mis à jour après déconnexion', undefined, loggerContexts.AUTH);
    } catch (error) {
      errorService.handleError(
        ErrorType.AUTH_SIGNOUT_FAILED,
        error as Error,
        { context: 'signOut' }
      );
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUser,
  };
}

export { AuthContext };
