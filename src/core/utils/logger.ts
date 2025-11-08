/**
 * Centralized logging utility
 *
 * Provides consistent logging across the application with different levels.
 * In production, debug/info logs can be disabled while keeping errors.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!isDevelopment && (level === "debug" || level === "info")) {
      return false;
    }
    return true;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  // Specific domain loggers for better organization
  audio = {
    loaded: (trackId: string) => this.info(`Sound loaded for track ${trackId}`),
    error: (message: string, error?: Error) => this.error(`Audio: ${message}`, error),
  };

  midi = {
    deviceConnected: (name: string) => this.info(`MIDI device connected: ${name}`),
    deviceDisconnected: (name: string) => this.info(`MIDI device disconnected: ${name}`),
    error: (message: string, error?: Error) => this.error(`MIDI: ${message}`, error),
  };

  playback = {
    started: () => this.debug("Playback started"),
    stopped: () => this.debug("Playback stopped"),
    error: (message: string, error?: Error) => this.error(`Playback: ${message}`, error),
  };

  api = {
    request: (endpoint: string) => this.debug(`API request: ${endpoint}`),
    response: (endpoint: string, status: number) =>
      this.debug(`API response: ${endpoint} - ${status}`),
    error: (endpoint: string, error?: Error) => this.error(`API error: ${endpoint}`, error),
  };
}

export const logger = new Logger();
