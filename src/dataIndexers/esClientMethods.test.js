const { 
  pingCluster, 
  getAmbientWeatherAliases, 
  createIndex, 
  getMostRecentDoc, 
  deleteIndex, 
  bulkIndexDocuments 
} = require('./esClientMethods');

// Mock the ES client
jest.mock('./esClient', () => ({
  ping: jest.fn(),
  cat: {
    aliases: jest.fn()
  },
  indices: {
    create: jest.fn(),
    delete: jest.fn()
  },
  search: jest.fn(),
  bulk: jest.fn(),
  count: jest.fn()
}));

// Mock the logger
jest.mock('../logger', () => {
  return function() {
    return {
      logError: jest.fn(),
      logInfo: jest.fn(),
      logWarning: jest.fn()
    };
  };
});

const mockEsClient = require('./esClient');

describe('esClientMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pingCluster', () => {
    it('should return true when ping is successful', async () => {
      mockEsClient.ping.mockResolvedValue({ body: true });

      const result = await pingCluster(mockEsClient);

      expect(mockEsClient.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when ping returns false', async () => {
      mockEsClient.ping.mockResolvedValue({ body: false });

      const result = await pingCluster(mockEsClient);

      expect(result).toBe(false);
    });
  });

  describe('getAmbientWeatherAliases', () => {
    it('should return aliases when successful', async () => {
      const mockAliases = [
        {
          alias: 'all-ambient-weather-heiligers-imperial',
          index: 'ambient_weather_heiligers_imperial_2021_06_12',
          is_write_index: 'false'
        }
      ];
      
      mockEsClient.cat.aliases.mockResolvedValue({
        body: mockAliases,
        statusCode: 200,
        headers: {},
        meta: {}
      });

      const result = await getAmbientWeatherAliases(mockEsClient);

      expect(mockEsClient.cat.aliases).toHaveBeenCalledWith({
        name: '*ambient-weather-heiligers-*',
        format: 'json',
        h: ['alias', 'index', 'is_write_index'],
        v: true,
        expand_wildcards: 'all'
      });
      expect(result).toEqual(mockAliases);
    });

    it('should handle non-200 status codes', async () => {
      mockEsClient.cat.aliases.mockResolvedValue({
        body: [],
        statusCode: 404,
        headers: {},
        meta: {}
      });

      const result = await getAmbientWeatherAliases(mockEsClient);

      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('ES connection failed');
      mockEsClient.cat.aliases.mockRejectedValue(error);

      const result = await getAmbientWeatherAliases(mockEsClient);

      expect(result).toBeUndefined();
    });
  });

  describe('createIndex', () => {
    it('should create index successfully', async () => {
      const mockResponse = {
        body: { acknowledged: true, shards_acknowledged: true, index: 'test-index' },
        statusCode: 200
      };
      const mappings = { properties: { field1: { type: 'text' } } };

      mockEsClient.indices.create.mockResolvedValue(mockResponse);

      const result = await createIndex(mockEsClient, 'test-index', mappings);

      expect(mockEsClient.indices.create).toHaveBeenCalledWith({
        index: 'test-index',
        body: { mappings }
      }, { ignore: [400] });
      expect(result).toBe(mockResponse);
    });

    it('should handle index creation errors', async () => {
      const error = new Error('Index creation failed');
      mockEsClient.indices.create.mockRejectedValue(error);

      await expect(createIndex(mockEsClient, 'test-index', {}))
        .rejects.toThrow('Index creation failed');
    });
  });

  describe('deleteIndex', () => {
    it('should delete index successfully', async () => {
      const mockResponse = {
        body: { acknowledged: true }
      };

      mockEsClient.indices.delete.mockResolvedValue(mockResponse);

      const result = await deleteIndex(mockEsClient, 'test-index');

      expect(mockEsClient.indices.delete).toHaveBeenCalledWith({
        index: 'test-index',
        timeout: '30s',
        master_timeout: '30s',
        ignore_unavailable: false,
        allow_no_indices: false,
        expand_wildcards: 'open,closed'
      });
      expect(result).toEqual({ acknowledged: true });
    });
  });

  describe('getMostRecentDoc', () => {
    it('should return most recent documents with default options', async () => {
      const mockHits = [
        { _id: '1', _source: { dateutc: 1640891100000 } }
      ];
      
      mockEsClient.search.mockResolvedValue({
        body: { hits: { hits: mockHits } },
        statusCode: 200
      });

      const result = await getMostRecentDoc(mockEsClient, 'test-index', {});

      expect(mockEsClient.search).toHaveBeenCalledWith({
        expand_wildcards: 'all',
        sort: ['dateutc:desc'],
        size: 10,
        _source: [],
        index: 'test-index',
        body: { query: { match_all: {} } }
      });
      expect(result).toEqual(mockHits);
    });

    it('should handle custom options', async () => {
      const opts = {
        size: 1,
        _source: ['date', 'dateutc'],
        sortBy: [{ field: 'dateutc', direction: 'desc' }],
        expandWildcards: 'open'
      };
      const mockHits = [{ _id: '1', _source: { dateutc: 1640891100000 } }];
      
      mockEsClient.search.mockResolvedValue({
        body: { hits: { hits: mockHits } }
      });

      const result = await getMostRecentDoc(mockEsClient, 'test-index', opts);

      expect(mockEsClient.search).toHaveBeenCalledWith({
        expand_wildcards: 'open',
        sort: ['dateutc:desc'],
        size: 1,
        _source: ['date', 'dateutc'],
        index: 'test-index',
        body: { query: { match_all: {} } }
      });
      expect(result).toEqual(mockHits);
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockEsClient.search.mockRejectedValue(error);

      const result = await getMostRecentDoc(mockEsClient, 'test-index', {});

      expect(result).toBeUndefined();
    });
  });

  describe('bulkIndexDocuments', () => {
    it('should bulk index documents successfully', async () => {
      const payload = [
        { index: { _index: 'test-index' } },
        { field1: 'value1' },
        { index: { _index: 'test-index' } },
        { field1: 'value2' }
      ];

      mockEsClient.bulk.mockResolvedValue({
        body: { errors: false, items: [] }
      });
      mockEsClient.count.mockResolvedValue({
        body: { count: 2 }
      });

      const result = await bulkIndexDocuments(mockEsClient, 'test-index', payload);

      expect(mockEsClient.bulk).toHaveBeenCalledWith({
        refresh: 'true',
        body: payload
      });
      expect(mockEsClient.count).toHaveBeenCalledWith({ index: 'test-index' });
      expect(result).toEqual({
        indexCounts: { count: 2 },
        erroredDocuments: []
      });
    });

    it('should handle bulk index errors', async () => {
      const payload = [
        { index: { _index: 'test-index' } },
        { field1: 'value1' }
      ];

      mockEsClient.bulk.mockResolvedValue({
        body: {
          errors: true,
          items: [
            {
              index: {
                status: 400,
                error: { type: 'mapping_exception', reason: 'Field mapping error' }
              }
            }
          ]
        }
      });
      mockEsClient.count.mockResolvedValue({
        body: { count: 0 }
      });

      const result = await bulkIndexDocuments(mockEsClient, 'test-index', payload);

      expect(result.erroredDocuments).toHaveLength(1);
      expect(result.erroredDocuments[0]).toMatchObject({
        status: 400,
        error: { type: 'mapping_exception', reason: 'Field mapping error' },
        operation: { index: { _index: 'test-index' } },
        document: { field1: 'value1' }
      });
    });

    it('should handle 429 throttling errors', async () => {
      const payload = [
        { index: { _index: 'test-index' } },
        { field1: 'value1' }
      ];

      mockEsClient.bulk.mockResolvedValue({
        body: {
          errors: true,
          items: [
            {
              index: {
                status: 429,
                error: { type: 'es_rejected_execution_exception', reason: 'Too many requests' }
              }
            }
          ]
        }
      });
      mockEsClient.count.mockResolvedValue({
        body: { count: 0 }
      });

      const result = await bulkIndexDocuments(mockEsClient, 'test-index', payload);

      expect(result.erroredDocuments).toHaveLength(1);
      expect(result.erroredDocuments[0].status).toBe(429);
    });

    it('should handle custom bulk options', async () => {
      const payload = [];
      const opts = { timeout: '60s' };

      mockEsClient.bulk.mockResolvedValue({
        body: { errors: false, items: [] }
      });
      mockEsClient.count.mockResolvedValue({
        body: { count: 0 }
      });

      await bulkIndexDocuments(mockEsClient, 'test-index', payload, opts);

      // The actual implementation spreads opts into bulkConfig, but only uses refresh
      expect(mockEsClient.bulk).toHaveBeenCalledWith({
        refresh: 'true',
        body: payload
      });
    });
  });
});