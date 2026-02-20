import { AuthUser, UserProfile } from '../../../shared/types';
import { supabase } from '../../../lib/supabase';
import { logger, loggerContexts } from '../../../shared/utils/logger';
import { errorService, ErrorType } from '../../../shared/services/errorService';

/**
 * Service d'authentification centralisé pour Sanozia
 * 
 * @description Gère toutes les opérations d'authentification via Supabase :
 * inscription, connexion, déconnexion, récupération du profil utilisateur,
 * et écoute des changements d'état d'authentification.
 * 
 * @example
 * ```typescript
 * // Connexion utilisateur
 * const result = await authService.signIn(email, password);
 * 
 * // Récupération de l'utilisateur actuel
 * const user = await authService.getCurrentUser();
 * 
 * // Écoute des changements d'état
 * authService.onAuthStateChange((user) => {
 *   console.log('État auth changé:', user);
 * });
 * ```
 * 
 * @class AuthService
 */
class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   * 
   * @description Crée un nouveau compte utilisateur avec email et mot de passe.
   * Envoie automatiquement un email de confirmation si configuré.
   * 
   * @param email - Adresse email de l'utilisateur
   * @param password - Mot de passe (minimum 6 caractères)
   * @returns Promesse résolue avec les données d'inscription Supabase
   * 
   * @throws {Error} Si l'inscription échoue (email déjà utilisé, mot de passe faible, etc.)
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await authService.signUp('user@example.com', 'password123');
   *   console.log('Inscription réussie:', result.user?.email);
   * } catch (error) {
   *   console.error('Erreur inscription:', error.message);
   * }
   * ```
   */
  async signUp(email: string, password: string) {
    if (!supabase) {
      throw new Error('L\'application n\'est pas encore configurée avec une base de données. Veuillez contacter l\'administrateur.');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Connexion d'un utilisateur existant
   * 
   * @description Authentifie un utilisateur avec email et mot de passe.
   * Récupère automatiquement le profil complet après connexion réussie.
   * 
   * @param email - Adresse email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @returns Promesse résolue avec l'utilisateur authentifié et son profil
   * 
   * @throws {Error} Si la connexion échoue (identifiants incorrects, compte non confirmé, etc.)
   * 
   * @example
   * ```typescript
   * try {
   *   const user = await authService.signIn('user@example.com', 'password123');
   *   console.log('Connexion réussie:', user?.email);
   * } catch (error) {
   *   console.error('Erreur connexion:', error.message);
   * }
   * ```
   */
  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('L\'application n\'est pas encore configurée avec une base de données. Veuillez contacter l\'administrateur.');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Déconnexion de l'utilisateur actuel
   * 
   * @description Déconnecte l'utilisateur de la session Supabase.
   * Efface automatiquement toutes les données de session locales.
   * 
   * @returns Promesse résolue quand la déconnexion est terminée
   * 
   * @throws {Error} Si la déconnexion échoue
   * 
   * @example
   * ```typescript
   * try {
   *   await authService.signOut();
   *   console.log('Déconnexion réussie');
   * } catch (error) {
   *   console.error('Erreur déconnexion:', error.message);
   * }
   * ```
   */
  async signOut() {
    if (!supabase) {
      throw new Error('L\'application n\'est pas encore configurée avec une base de données.');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('L\'application n\'est pas encore configurée avec une base de données.');
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  /**
   * Récupère l'utilisateur actuellement authentifié
   * 
   * @description Obtient l'utilisateur Supabase actuel et son profil complet.
   * Combine les données d'authentification avec les données de profil
   * stockées dans la table 'profiles'.
   * 
   * @returns Promesse résolue avec l'utilisateur complet ou null si non connecté
   * 
   * @example
   * ```typescript
   * const user = await authService.getCurrentUser();
   * if (user) {
   *   console.log('Utilisateur connecté:', user.email);
   *   console.log('Profil complet:', user.profile);
   * } else {
   *   console.log('Aucun utilisateur connecté');
   * }
   * ```
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!supabase) {
        logger.warn('Supabase non configuré', undefined, loggerContexts.AUTH);
        return null;
      }

      logger.debug('Récupération utilisateur actuel', undefined, loggerContexts.AUTH);

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        logger.error('Erreur lors de la récupération de l\'utilisateur', error, loggerContexts.AUTH);
        
        // Si la session est invalide, on déconnecte automatiquement
        if (error.message?.includes('Session from session_id claim in JWT does not exist')) {
          logger.info('Session invalide détectée, déconnexion automatique', undefined, loggerContexts.AUTH);
          await this.signOut();
          return null;
        }
        
        return null;
      }
      
      if (!user) {
        logger.debug('Pas d\'utilisateur connecté', undefined, loggerContexts.AUTH);
        return null;
      }

      logger.debug('Utilisateur Supabase récupéré', { userId: user.id }, loggerContexts.AUTH);

      // Essayer de récupérer le profil associé avec gestion d'erreur robuste
      let profile: UserProfile | null = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          logger.error('Erreur lors de la récupération du profil', profileError, loggerContexts.AUTH);
          // Continuer sans profil si erreur de base de données
        } else if (profileData) {
          profile = profileData as UserProfile;
          logger.debug('Profil récupéré avec succès', {
            userId: user.id,
            hasProfile: !!profile,
            isProfileComplete: profile.is_profile_complete
          }, loggerContexts.AUTH);
        }
      } catch (profileError) {
        logger.error('Exception lors de la récupération du profil', profileError, loggerContexts.AUTH);
        // Continuer sans profil
      }

      const finalUser: AuthUser = {
        ...user,
        profile: profile ? {
          ...profile,
          is_profile_complete: profile.is_profile_complete ?? false
        } : undefined,
      };
      
      logger.debug('Utilisateur final retourné', {
        userId: finalUser.id,
        hasProfile: !!finalUser.profile,
        isProfileComplete: finalUser.profile?.is_profile_complete
      }, loggerContexts.AUTH);

      return finalUser;
    } catch (error) {
      logger.error('Exception dans getCurrentUser', error, loggerContexts.AUTH);
      return null;
    }
  }

  /**
   * Écoute les changements d'état d'authentification
   * 
   * @description Enregistre un callback qui sera appelé à chaque changement
   * d'état d'authentification (connexion, déconnexion, expiration de session).
   * Récupère automatiquement le profil complet lors des changements.
   * 
   * @param callback - Fonction appelée avec l'utilisateur actuel (ou null)
   * @returns Fonction de nettoyage pour arrêter l'écoute
   * 
   * @example
   * ```typescript
   * const unsubscribe = authService.onAuthStateChange((user) => {
   *   if (user) {
   *     console.log('Utilisateur connecté:', user.email);
   *   } else {
   *     console.log('Utilisateur déconnecté');
   *   }
   * });
   * 
   * // Arrêter l'écoute
   * unsubscribe();
   * ```
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) {
      callback(null);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      };
    }
    
    return supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state change', { event, userId: session?.user?.id }, loggerContexts.AUTH);
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const user = await this.getCurrentUser();
          callback(user);
        } catch (error) {
          errorService.handleError(
            ErrorType.AUTH_PROFILE_FETCH_FAILED,
            error as Error,
            { context: 'onAuthStateChange_profileFetch' }
          );
          callback(null);
        }
      }
    });
  }
}

export const authService = new AuthService();
