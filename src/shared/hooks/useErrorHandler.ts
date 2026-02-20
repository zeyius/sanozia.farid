import { useState, useEffect, useCallback } from 'react';
import { errorService, AppError, ErrorType } from '../services/errorService';

interface ErrorState {
  currentError: AppError | null;
  errorHistory: AppError[];
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    currentError: null,
    errorHistory: []
  });

  // Gestionnaire d'erreur qui met à jour l'état UI
  const handleError = useCallback((error: AppError) => {
    setErrorState(prev => ({
      currentError: error,
      errorHistory: [error, ...prev.errorHistory.slice(0, 9)] // Garder les 10 dernières erreurs
    }));

    // Auto-clear l'erreur après 5 secondes pour les erreurs non critiques
    if (!isCriticalError(error.type)) {
      setTimeout(() => {
        setErrorState(prev => ({
          ...prev,
          currentError: prev.currentError?.timestamp === error.timestamp ? null : prev.currentError
        }));
      }, 5000);
    }
  }, []);

  // Enregistrer le gestionnaire d'erreur au montage
  useEffect(() => {
    errorService.addErrorHandler(handleError);
    
    return () => {
      errorService.removeErrorHandler(handleError);
    };
  }, [handleError]);

  // Fonction pour signaler une erreur
  const reportError = useCallback((
    type: ErrorType,
    originalError?: Error | string,
    context?: Record<string, unknown>
  ) => {
    return errorService.handleError(type, originalError, context);
  }, []);

  // Fonction pour effacer l'erreur actuelle
  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      currentError: null
    }));
  }, []);

  // Fonction pour effacer tout l'historique
  const clearHistory = useCallback(() => {
    setErrorState({
      currentError: null,
      errorHistory: []
    });
  }, []);

  return {
    // État
    currentError: errorState.currentError,
    errorHistory: errorState.errorHistory,
    hasError: !!errorState.currentError,
    
    // Actions
    reportError,
    clearError,
    clearHistory,
    
    // Utilitaires
    isAuthError: errorState.currentError ? isAuthError(errorState.currentError.type) : false,
    isCriticalError: errorState.currentError ? isCriticalError(errorState.currentError.type) : false
  };
}

/**
 * Détermine si une erreur est liée à l'authentification
 */
function isAuthError(type: ErrorType): boolean {
  return [
    ErrorType.AUTH_SIGNIN_FAILED,
    ErrorType.AUTH_SIGNUP_FAILED,
    ErrorType.AUTH_SIGNOUT_FAILED,
    ErrorType.AUTH_PROFILE_FETCH_FAILED,
    ErrorType.AUTH_SESSION_EXPIRED
  ].includes(type);
}

/**
 * Détermine si une erreur est critique (nécessite une action utilisateur)
 */
function isCriticalError(type: ErrorType): boolean {
  return [
    ErrorType.AUTH_SESSION_EXPIRED,
    ErrorType.VALIDATION_FAILED,
    ErrorType.FORM_SUBMISSION_FAILED
  ].includes(type);
}
