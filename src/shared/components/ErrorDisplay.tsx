import React from 'react';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorType } from '../services/errorService';

interface ErrorDisplayProps {
  className?: string;
}

export function ErrorDisplay({ className = '' }: ErrorDisplayProps) {
  const { currentError, clearError, isAuthError, isCriticalError } = useErrorHandler();

  if (!currentError) {
    return null;
  }

  const getErrorIcon = () => {
    if (isCriticalError) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (isAuthError) {
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const getErrorStyles = () => {
    if (isCriticalError) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (isAuthError) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const shouldShowDetails = currentError.context && Object.keys(currentError.context).length > 0;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <div className={`rounded-lg border p-4 shadow-lg ${getErrorStyles()}`}>
        <div className="flex items-start gap-3">
          {getErrorIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">
                {getErrorTitle(currentError.type)}
              </h4>
              <button
                onClick={clearError}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm opacity-90 mb-2">
              {currentError.message}
            </p>
            
            {shouldShowDetails && (
              <details className="text-xs opacity-75">
                <summary className="cursor-pointer hover:opacity-100">
                  Détails techniques
                </summary>
                <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto">
                  {JSON.stringify(currentError.context, null, 2)}
                </pre>
              </details>
            )}
            
            <div className="text-xs opacity-60 mt-2">
              {currentError.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Titres d'erreur user-friendly
 */
function getErrorTitle(type: ErrorType): string {
  const titles: Record<ErrorType, string> = {
    // Authentification
    [ErrorType.AUTH_SIGNIN_FAILED]: 'Connexion échouée',
    [ErrorType.AUTH_SIGNUP_FAILED]: 'Inscription échouée',
    [ErrorType.AUTH_SIGNOUT_FAILED]: 'Déconnexion échouée',
    [ErrorType.AUTH_PROFILE_FETCH_FAILED]: 'Profil inaccessible',
    [ErrorType.AUTH_SESSION_EXPIRED]: 'Session expirée',
    
    // Données
    [ErrorType.DATA_FETCH_FAILED]: 'Chargement échoué',
    [ErrorType.DATA_SAVE_FAILED]: 'Sauvegarde échouée',
    [ErrorType.DATA_DELETE_FAILED]: 'Suppression échouée',
    [ErrorType.DATA_EXPORT_FAILED]: 'Export échoué',
    
    // Validation
    [ErrorType.VALIDATION_FAILED]: 'Données invalides',
    [ErrorType.FORM_SUBMISSION_FAILED]: 'Envoi échoué',
    
    // Système
    [ErrorType.STORAGE_ERROR]: 'Erreur de stockage',
    [ErrorType.NETWORK_ERROR]: 'Problème réseau',
    [ErrorType.UNKNOWN_ERROR]: 'Erreur inattendue'
  };

  return titles[type] || titles[ErrorType.UNKNOWN_ERROR];
}
