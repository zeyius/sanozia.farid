/**
 * @fileoverview Système de logging configurable pour Sanozia
 * @module Logger
 * 
 * Ce module fournit un système de logging centralisé qui peut être
 * configuré pour différents environnements (dev/prod).
 * 
 * @example
 * ```typescript
 * import { logger, loggerContexts } from './logger';
 * 
 * // Logging simple
 * logger.info('Utilisateur connecté', { userId: '123' });
 * 
 * // Logging avec contexte
 * logger.debug('Navigation vers dashboard', undefined, loggerContexts.NAVIGATION);
 * 
 * // Logging d'erreur
 * logger.error('Erreur API', error, loggerContexts.API);
 * ```
 */

/**
 * Niveaux de logging disponibles
 * - debug: Informations de débogage (dev uniquement)
 * - info: Informations générales
 * - warn: Avertissements
 * - error: Erreurs
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Classe Logger centralisée pour l'application Sanozia
 * 
 * Gère les logs avec différents niveaux et contextes.
 * En développement, tous les niveaux sont activés.
 * En production, seuls warn et error sont activés.
 * 
 * @class Logger
 */
class Logger {
  /** Indicateur d'environnement de développement */
  private isDevelopment = true; // TODO: Configurer selon l'environnement
  
  /** Niveaux de log activés selon l'environnement */
  private enabledLevels: LogLevel[] = this.isDevelopment 
    ? ['debug', 'info', 'warn', 'error']
    : ['warn', 'error'];

  /**
   * Log un message de debug (uniquement en développement)
   * 
   * @param message - Message à logger
   * @param data - Données additionnelles (optionnel)
   * @param context - Contexte du log (optionnel, utiliser loggerContexts)
   * 
   * @example
   * ```typescript
   * logger.debug('Utilisateur trouvé', { userId: '123' }, loggerContexts.AUTH);
   * ```
   */
  debug(message: string, data?: Record<string, unknown> | string | number | boolean | null, context?: string): void {
    this.log('debug', message, data, context);
  }

  /**
   * Log un message d'information
   * 
   * @param message - Message à logger
   * @param data - Données additionnelles (optionnel)
   * @param context - Contexte du log (optionnel, utiliser loggerContexts)
   * 
   * @example
   * ```typescript
   * logger.info('Connexion réussie', { userEmail: 'user@example.com' }, loggerContexts.AUTH);
   * ```
   */
  info(message: string, data?: Record<string, unknown> | string | number | boolean | null, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * Log un avertissement
   * 
   * @param message - Message d'avertissement
   * @param data - Données additionnelles (optionnel)
   * @param context - Contexte du log (optionnel, utiliser loggerContexts)
   * 
   * @example
   * ```typescript
   * logger.warn('Configuration manquante', { configKey: 'API_URL' }, loggerContexts.API);
   * ```
   */
  warn(message: string, data?: Record<string, unknown> | string | number | boolean | null, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * Log une erreur
   * 
   * @param message - Message d'erreur
   * @param data - Données d'erreur (Error object, stack trace, etc.)
   * @param context - Contexte du log (optionnel, utiliser loggerContexts)
   * 
   * @example
   * ```typescript
   * logger.error('Erreur API', error, loggerContexts.API);
   * ```
   */
  error(message: string, data?: Record<string, unknown> | string | number | boolean | null, context?: string): void {
    this.log('error', message, data, context);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown> | string | number | boolean | null, context?: string): void {
    if (!this.enabledLevels.includes(level)) {
      return;
    }

    const prefix = this.getPrefix(level, context);
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }

    // En production, on pourrait envoyer les logs vers un service externe
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService();
    }
  }

  private getPrefix(level: LogLevel, context?: string): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    const contextStr = context ? `[${context}]` : '';
    return `${emoji[level]} ${contextStr}`;
  }

  private sendToExternalService(): void {
    // TODO: Implémenter l'envoi vers un service de logging externe
    console.log('📤 Envoi vers service externe');
  }
}

/**
 * Instance singleton du logger pour toute l'application
 * 
 * @example
 * ```typescript
 * import { logger } from './logger';
 * logger.info('Message');
 * ```
 */
export const logger = new Logger();

/**
 * Contextes prédéfinis pour faciliter l'usage et la cohérence
 * 
 * Utilisez ces contextes pour catégoriser vos logs :
 * - AUTH: Authentification et autorisation
 * - NAVIGATION: Routing et navigation
 * - API: Appels API et services externes
 * - PROFILE: Gestion du profil utilisateur
 * - MEAL: Suivi des repas
 * - STOOL: Suivi des selles
 * - SYMPTOM: Suivi des symptômes
 * - UI: Interactions interface utilisateur
 * 
 * @example
 * ```typescript
 * import { logger, loggerContexts } from './logger';
 * logger.debug('Navigation vers profil', undefined, loggerContexts.NAVIGATION);
 * ```
 */
export const loggerContexts = {
  AUTH: 'Auth',
  NAVIGATION: 'Navigation',
  API: 'API',
  PROFILE: 'Profile',
  MEAL: 'Meal',
  STOOL: 'Stool',
  SYMPTOM: 'Symptom',
  UI: 'UI'
} as const;
