const Logger = require('./Logger');

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger('TestLogger');
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('constructor', () => {
    it('should create a logger with the provided name', () => {
      expect(logger.name).toBe('TestLogger');
    });
  });

  describe('logMessage', () => {
    it('should log a message without meta', () => {
      logger.logMessage('test message');
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test message');
    });

    it('should log a message with meta', () => {
      const meta = { key: 'value' };
      logger.logMessage('test message', meta);
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test message', meta);
    });

    it('should handle null meta', () => {
      logger.logMessage('test message', null);
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test message');
    });

    it('should handle undefined meta', () => {
      logger.logMessage('test message', undefined);
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test message');
    });
  });

  describe('logError', () => {
    it('should log an error without meta', () => {
      logger.logError('test error');
      expect(consoleSpy.error).toHaveBeenCalledWith('TestLogger:', 'test error');
    });

    it('should log an error with meta', () => {
      const meta = { error: 'details' };
      logger.logError('test error', meta);
      expect(consoleSpy.error).toHaveBeenCalledWith('TestLogger:', 'test error', meta);
    });

    it('should handle null meta', () => {
      logger.logError('test error', null);
      expect(consoleSpy.error).toHaveBeenCalledWith('TestLogger:', 'test error');
    });
  });

  describe('logInfo', () => {
    it('should log info without meta', () => {
      logger.logInfo('test info');
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test info');
    });

    it('should log info with meta', () => {
      const meta = { info: 'details' };
      logger.logInfo('test info', meta);
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test info', meta);
    });

    it('should handle null meta', () => {
      logger.logInfo('test info', null);
      expect(consoleSpy.log).toHaveBeenCalledWith('TestLogger:', 'test info');
    });
  });

  describe('logWarning', () => {
    it('should log a warning without meta', () => {
      logger.logWarning('test warning');
      expect(consoleSpy.warn).toHaveBeenCalledWith('TestLogger:', 'test warning');
    });

    it('should log a warning with meta', () => {
      const meta = { warning: 'details' };
      logger.logWarning('test warning', meta);
      expect(consoleSpy.warn).toHaveBeenCalledWith('TestLogger:', 'test warning', meta);
    });

    it('should handle null meta', () => {
      logger.logWarning('test warning', null);
      expect(consoleSpy.warn).toHaveBeenCalledWith('TestLogger:', 'test warning');
    });
  });
});