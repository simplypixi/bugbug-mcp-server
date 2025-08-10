import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/node';
import { 
  initializeSentry, 
  captureException, 
  captureMessage, 
  addBreadcrumb, 
  closeSentry 
} from '../sentry.js';

// Mock Sentry
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback) => callback(mockScope)),
  close: vi.fn(),
  Integrations: {
    Http: vi.fn(),
    Console: vi.fn(),
  },
}));

const mockScope = {
  setTag: vi.fn(),
};

describe('Sentry Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initializeSentry', () => {
    it('should not initialize Sentry when SENTRY_DSN is not provided', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      initializeSentry();

      // Assert
      expect(Sentry.init).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('SENTRY_DSN not provided, Sentry monitoring disabled');
    });

    it('should initialize Sentry with correct configuration when SENTRY_DSN is provided', () => {
      // Arrange
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      initializeSentry();

      // Assert
      expect(Sentry.init).toHaveBeenCalledWith({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        debug: false,
        sendDefaultPii: true,
        tracesSampleRate: 0.1,
        release: '1.0.1',
        beforeSend: expect.any(Function),
        beforeBreadcrumb: expect.any(Function),
        integrations: expect.any(Array),
      });
      expect(consoleSpy).toHaveBeenCalledWith('✅ Sentry initialized for production environment');
    });

    it('should use development environment as default', () => {
      // Arrange
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      initializeSentry();

      // Assert
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'development',
          debug: false,
          tracesSampleRate: 1.0,
        })
      );
    });

    it('should configure beforeSend function', () => {
      // Arrange
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      vi.spyOn(console, 'debug').mockImplementation(() => {});

      // Act
      initializeSentry();

      // Assert
      const initCall = vi.mocked(Sentry.init).mock.calls[0]?.[0];
      expect(initCall).toBeDefined();
      expect(initCall?.beforeSend).toBeDefined();
      expect(typeof initCall?.beforeSend).toBe('function');
    });
  });

  describe('captureException', () => {
    it('should capture exception without context', () => {
      // Arrange
      const error = new Error('Test error');

      // Act
      captureException(error);

      // Assert
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
      expect(Sentry.withScope).not.toHaveBeenCalled();
    });

    it('should capture exception with context', () => {
      // Arrange
      const error = new Error('Test error');
      const context = { component: 'test', operation: 'test-op' };

      // Act
      captureException(error, context);

      // Assert
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'test');
      expect(mockScope.setTag).toHaveBeenCalledWith('operation', 'test-op');
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('captureMessage', () => {
    it('should capture message with default level and no context', () => {
      // Arrange
      const message = 'Test message';

      // Act
      captureMessage(message);

      // Assert
      expect(Sentry.captureMessage).toHaveBeenCalledWith(message, 'info');
      expect(Sentry.withScope).not.toHaveBeenCalled();
    });

    it('should capture message with custom level and context', () => {
      // Arrange
      const message = 'Test error message';
      const context = { component: 'test' };

      // Act
      captureMessage(message, 'error', context);

      // Assert
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(mockScope.setTag).toHaveBeenCalledWith('component', 'test');
      expect(Sentry.captureMessage).toHaveBeenCalledWith(message, 'error');
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb with message and category', () => {
      // Arrange
      const message = 'Test breadcrumb';
      const category = 'test';

      // Act
      addBreadcrumb(message, category);

      // Assert
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        data: undefined,
        level: 'info',
      });
    });

    it('should add breadcrumb with data', () => {
      // Arrange
      const message = 'Test breadcrumb';
      const category = 'test';
      const data = { key: 'value' };

      // Act
      addBreadcrumb(message, category, data);

      // Assert
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        category,
        data,
        level: 'info',
      });
    });
  });

  describe('closeSentry', () => {
    it('should close Sentry with timeout', async () => {
      // Arrange
      vi.mocked(Sentry.close).mockResolvedValue(true);

      // Act
      await closeSentry();

      // Assert
      expect(Sentry.close).toHaveBeenCalledWith(2000);
    });
  });
});
