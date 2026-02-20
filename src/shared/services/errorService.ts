// === SERVICE DE GESTION D'ERREURS CENTRALISÉ ===

/**
 * Types d'erreurs standardisés pour l'application Sanozia
 * 
 * @description Énumération des différents types d'erreurs possibles dans l'application.
 * Chaque type correspond à une catégorie spécifique d'erreur avec des messages
 * et des traitements appropriés.
 * 
 * @example
 * ```typescript
 * errorService.handleError(ErrorType.AUTH_SIGNIN_FAILED, error, { email });
 * ```
 */
export enum ErrorType {
  // Erreurs d'authentification
  AUTH_SIGNIN_FAILED = 'AUTH_SIGNIN_FAILED',
  AUTH_SIGNUP_FAILED = 'AUTH_SIGNUP_FAILED',
  AUTH_SIGNOUT_FAILED = 'AUTH_SIGNOUT_FAILED',
  AUTH_PROFILE_FETCH_FAILED = 'AUTH_PROFILE_FETCH_FAILED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  
  // Erreurs de données/API
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  DATA_DELETE_FAILED = 'DATA_DELETE_FAILED',
  DATA_EXPORT_FAILED = 'DATA_EXPORT_FAILED',
  
  // Erreurs de validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  FORM_SUBMISSION_FAILED = 'FORM_SUBMISSION_FAILED',
  
  // Erreurs système
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface représentant une erreur applicative standardisée
 * 
 * @description Structure unifiée pour toutes les erreurs de l'application,
 * incluant le type, le message user-friendly, l'erreur originale et le contexte.
 * 
 * @interface AppError
 */
export interface AppError {
  /** Type d'erreur standardisé */
  type: ErrorType;
  /** Message d'erreur localisé et user-friendly */
  message: string;
  /** Erreur JavaScript originale (optionnelle) */
  originalError?: Error | string;
  /** Contexte additionnel pour le débogage */
  context?: Record<string, unknown>;
  /** Horodatage de l'erreur */
  timestamp: Date;
  /** ID de l'utilisateur concerné (optionnel) */
  userId?: string;
}

/**
 * Service centralisé de gestion des erreurs
 * 
 * @description Gère toutes les erreurs de l'application de manière centralisée.
 * Fournit des messages user-friendly, des logs structurés et un système
 * de notification pour l'interface utilisateur.
 * 
 * @example
 * ```typescript
 * // Signaler une erreur d'authentification
 * errorService.handleError(
 *   ErrorType.AUTH_SIGNIN_FAILED,
 *   error,
 *   { email: 'user@example.com' }
 * );
 * 
 * // Ajouter un gestionnaire d'erreur pour l'UI
 * errorService.addErrorHandler((error) => {
 *   showNotification(error.message);
 * });
 * ```
 * 
 * @class ErrorService
 */
class ErrorService {
  /** Liste des gestionnaires d'erreur enregistrés */
  private errorHandlers: ((error: AppError) => void)[] = [];

  /**
   * Ajoute un gestionnaire d'erreur pour recevoir les notifications
   * 
   * @description Enregistre une fonction callback qui sera appelée
   * à chaque fois qu'une erreur est signalée via handleError().
   * Utilisé principalement par les composants UI pour afficher les erreurs.
   * 
   * @param handler - Fonction callback à exécuter lors d'une erreur
   * 
   * @example
   * ```typescript
   * errorService.addErrorHandler((error) => {
   *   setCurrentError(error);
   *   showToast(error.message);
   * });
   * ```
   */
  addErrorHandler(handler: (error: AppError) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Supprime un gestionnaire d'erreur précédemment enregistré
   * 
   * @description Retire une fonction callback de la liste des gestionnaires.
   * Important pour éviter les fuites mémoire lors du démontage des composants.
   * 
   * @param handler - Fonction callback à supprimer
   * 
   * @example
   * ```typescript
   * useEffect(() => {
   *   const handler = (error) => showToast(error.message);
   *   errorService.addErrorHandler(handler);
   *   
   *   return () => errorService.removeErrorHandler(handler);
   * }, []);
   * ```
   */
  removeErrorHandler(handler: (error: AppError) => void): void {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  /**
   * Gère une erreur de manière centralisée
   * 
   * @description Point d'entrée principal pour signaler toutes les erreurs
   * de l'application. Crée un objet AppError standardisé, notifie tous
   * les gestionnaires enregistrés et log l'erreur pour le débogage.
   * 
   * @param type - Type d'erreur standardisé (voir ErrorType enum)
   * @param originalError - Erreur JavaScript originale (optionnelle)
   * @param context - Contexte additionnel pour le débogage
   * @returns L'objet AppError créé
   * 
   * @example
   * ```typescript
   * try {
   *   await signIn(email, password);
   * } catch (error) {
   *   errorService.handleError(
   *     ErrorType.AUTH_SIGNIN_FAILED,
   *     error,
   *     { email, timestamp: Date.now() }
   *   );
   * }
   * ```
   */
  handleError(
    type: ErrorType,
    originalError?: Error | string,
    context?: Record<string, unknown>
  ): AppError {
    const appError: AppError = {
      type,
      message: this.getErrorMessage(type),
      originalError: originalError,
      context,
      timestamp: new Date(),
      userId: this.getCurrentUserId()
    };

    // Log l'erreur pour le débogage
    console.error('🚨 [ErrorService]', {
      type: appError.type,
      message: appError.message,
      context: appError.context,
      originalError: typeof appError.originalError === 'string' 
        ? appError.originalError 
        : appError.originalError?.message
    });

    // Notifier tous les gestionnaires d'erreur
    this.errorHandlers.forEach(handler => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Erreur dans un gestionnaire d\'erreur:', handlerError);
      }
    });

    return appError;
  }

  /**
   * Messages d'erreur localisés et user-friendly
   */
  private getErrorMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      // Authentification
      [ErrorType.AUTH_SIGNIN_FAILED]: 'Échec de la connexion. Vérifiez vos identifiants.',
      [ErrorType.AUTH_SIGNUP_FAILED]: 'Échec de l\'inscription. Veuillez réessayer.',
      [ErrorType.AUTH_SIGNOUT_FAILED]: 'Erreur lors de la déconnexion.',
      [ErrorType.AUTH_PROFILE_FETCH_FAILED]: 'Impossible de récupérer votre profil.',
      [ErrorType.AUTH_SESSION_EXPIRED]: 'Votre session a expiré. Veuillez vous reconnecter.',
      
      // Données
      [ErrorType.DATA_FETCH_FAILED]: 'Erreur lors du chargement des données.',
      [ErrorType.DATA_SAVE_FAILED]: 'Erreur lors de la sauvegarde.',
      [ErrorType.DATA_DELETE_FAILED]: 'Erreur lors de la suppression.',
      [ErrorType.DATA_EXPORT_FAILED]: 'Erreur lors de l\'export des données.',
      
      // Validation
      [ErrorType.VALIDATION_FAILED]: 'Données invalides. Vérifiez votre saisie.',
      [ErrorType.FORM_SUBMISSION_FAILED]: 'Erreur lors de l\'envoi du formulaire.',
      
      // Système
      [ErrorType.STORAGE_ERROR]: 'Erreur de stockage local.',
      [ErrorType.NETWORK_ERROR]: 'Problème de connexion réseau.',
      [ErrorType.UNKNOWN_ERROR]: 'Une erreur inattendue s\'est produite.'
    };

    return messages[type] || messages[ErrorType.UNKNOWN_ERROR];
  }

  /**
   * Récupère l'ID utilisateur actuel pour le contexte
   */
  private getCurrentUserId(): string | undefined {
    // TODO: Intégrer avec le système d'authentification
    return undefined;
  }

  /**
   * Détermine le type d'erreur basé sur l'erreur originale
   */
  categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('auth') || message.includes('signin') || message.includes('login')) {
      return ErrorType.AUTH_SIGNIN_FAILED;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_FAILED;
    }
    
    return ErrorType.UNKNOWN_ERROR;
  }
}

export const errorService = new ErrorService();
