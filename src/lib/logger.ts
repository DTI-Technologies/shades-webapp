/**
 * Custom logging system for the application
 * In a production environment, this would integrate with a service like Sentry, Datadog, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private sentryEnabled = false;

  private constructor() {
    // Initialize Sentry in a production environment
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      this.sentryEnabled = true;
      console.log('Sentry would be initialized here in production');
    }
  }

  /**
   * Get the singleton instance of the logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);

    // In production, send errors to Sentry
    if (this.sentryEnabled) {
      console.log('Error would be sent to Sentry in production:', message, context);
    }
  }

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console
    const formattedMessage = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context || '');
        break;
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'error':
        console.error(formattedMessage, context || '');
        break;
    }
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();
