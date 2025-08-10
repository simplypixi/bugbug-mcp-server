import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEnvironmentConfig, getEnvironmentConfig } from '../config.js';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return development configuration by default', () => {
      // Arrange
      delete process.env.NODE_ENV;

      // Act
      const config = getEnvironmentConfig();

      // Assert
      expect(config.nodeEnv).toBe('development');
      expect(config.isDevelopment).toBe(true);
      expect(config.isProduction).toBe(false);
      expect(config.debug).toBe(false);
      expect(config.logLevel).toBe('info');
    });

    it('should return production configuration when NODE_ENV is production', () => {
      // Arrange
      process.env.NODE_ENV = 'production';

      // Act
      const config = getEnvironmentConfig();

      // Assert
      expect(config.nodeEnv).toBe('production');
      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
    });

    it('should handle debug and log level configuration', () => {
      // Arrange
      process.env.DEBUG = 'true';
      process.env.LOG_LEVEL = 'debug';

      // Act
      const config = getEnvironmentConfig();

      // Assert
      expect(config.debug).toBe(true);
      expect(config.logLevel).toBe('debug');
    });

    it('should handle API key and Sentry DSN configuration', () => {
      // Arrange
      process.env.API_KEY = 'test-api-key';
      process.env.SENTRY_DSN = 'test-sentry-dsn';

      // Act
      const config = getEnvironmentConfig();

      // Assert
      expect(config.apiKey).toBe('test-api-key');
      expect(config.sentryDsn).toBe('test-sentry-dsn');
    });
  });

  describe('loadEnvironmentConfig', () => {
    it('should not throw when environment file is missing', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act & Assert
      expect(() => loadEnvironmentConfig()).not.toThrow();
      
      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should log configuration status', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      process.env.API_KEY = 'test-key';

      // Act
      loadEnvironmentConfig();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🔧 Environment configuration:');
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});
