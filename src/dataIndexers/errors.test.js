const { 
  isResponseError, 
  isUnauthorizedError, 
  indexDoesNotExist, 
  indexExistsError 
} = require('./errors');

// Mock the Elasticsearch errors
jest.mock('@elastic/elasticsearch', () => ({
  errors: {
    ResponseError: class ResponseError extends Error {
      constructor(message, statusCode, meta) {
        super(message);
        this.statusCode = statusCode;
        this.meta = meta;
      }
    }
  }
}));

const { errors } = require('@elastic/elasticsearch');

describe('errors module', () => {
  describe('isResponseError', () => {
    it('should return true for ResponseError instances', () => {
      const error = new errors.ResponseError('test error');
      expect(isResponseError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('test error');
      expect(isResponseError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isResponseError({})).toBe(false);
      expect(isResponseError(null)).toBe(false);
      expect(isResponseError(undefined)).toBe(false);
    });
  });

  describe('isUnauthorizedError', () => {
    it('should return true for 401 ResponseError', () => {
      const error = new errors.ResponseError('Unauthorized', 401);
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should return false for non-401 ResponseError', () => {
      const error = new errors.ResponseError('Bad Request', 400);
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Unauthorized');
      expect(isUnauthorizedError(error)).toBe(false);
    });
  });

  describe('indexDoesNotExist', () => {
    it('should return true for index_not_found_exception', () => {
      const error = new errors.ResponseError(
        '[index_not_found_exception] index does not exist',
        404,
        { body: { status: 404 } }
      );
      expect(indexDoesNotExist(error)).toBe(true);
    });

    it('should return false for different 404 errors', () => {
      const error = new errors.ResponseError(
        'Not found',
        404,
        { body: { status: 404 } }
      );
      expect(indexDoesNotExist(error)).toBe(false);
    });

    it('should return false for non-404 errors', () => {
      const error = new errors.ResponseError(
        '[index_not_found_exception] index does not exist',
        400,
        { body: { status: 400 } }
      );
      expect(indexDoesNotExist(error)).toBe(false);
    });

    it('should return false for regular errors', () => {
      const error = new Error('[index_not_found_exception] index does not exist');
      expect(indexDoesNotExist(error)).toBe(false);
    });
  });

  describe('indexExistsError', () => {
    it('should return true for resource_already_exists_exception', () => {
      const error = new errors.ResponseError(
        '[resource_already_exists_exception] index already exists',
        400,
        { body: { status: 400 } }
      );
      expect(indexExistsError(error)).toBe(true);
    });

    it('should return false for different 400 errors', () => {
      const error = new errors.ResponseError(
        'Bad request',
        400,
        { body: { status: 400 } }
      );
      expect(indexExistsError(error)).toBe(false);
    });

    it('should return false for non-400 errors', () => {
      const error = new errors.ResponseError(
        '[resource_already_exists_exception] index already exists',
        500,
        { body: { status: 500 } }
      );
      expect(indexExistsError(error)).toBe(false);
    });

    it('should return false for regular errors', () => {
      const error = new Error('[resource_already_exists_exception] index already exists');
      expect(indexExistsError(error)).toBe(false);
    });
  });
});