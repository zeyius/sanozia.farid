/**
 * @fileoverview Système de logging configurable pour Sanozia
 * @module Logger
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  /** Vite env (true in dev, false in prod build) */
  private isDevelopment = import.meta.env.DEV;

  private enabledLevels: LogLevel[] = this.isDevelopment
    ? ['debug', 'info', 'warn', 'error']
    : ['warn', 'error'];

  // ✅ Accept unknown (so passing caught errors works)
  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    if (!this.enabledLevels.includes(level)) return;

    const prefix = this.getPrefix(level, context);
    const logMessage = `${prefix} ${message}`;

    const normalized = this.normalizeData(data);

    switch (level) {
      case 'debug':
        normalized === undefined ? console.debug(logMessage) : console.debug(logMessage, normalized);
        break;
      case 'info':
        normalized === undefined ? console.info(logMessage) : console.info(logMessage, normalized);
        break;
      case 'warn':
        normalized === undefined ? console.warn(logMessage) : console.warn(logMessage, normalized);
        break;
      case 'error':
        normalized === undefined ? console.error(logMessage) : console.error(logMessage, normalized);
        break;
    }

    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService();
    }
  }

  private normalizeData(data: unknown): unknown {
    if (data === undefined) return undefined;

    // If it's an Error (or looks like one), serialize it
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack
      };
    }

    // Sometimes libs return plain objects that include message/code etc.
    // Keep them as-is.
    return data;
  }

  private getPrefix(level: LogLevel, context?: string): string {
    const emoji: Record<LogLevel, string> = {
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

export const logger = new Logger();

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