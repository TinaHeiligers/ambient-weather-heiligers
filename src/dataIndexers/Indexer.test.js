const IndexData = require('./Indexer');

// Mock the ES client module completely
jest.mock('./esClient', () => ({
  ping: jest.fn(),
  cat: { aliases: jest.fn() },
  search: jest.fn(),
  bulk: jest.fn(),
  count: jest.fn()
}));

// Mock the ES client methods
jest.mock('./esClientMethods', () => ({
  pingCluster: jest.fn(),
  getAmbientWeatherAliases: jest.fn(),
  getMostRecentDoc: jest.fn(),
  bulkIndexDocuments: jest.fn()
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

const { pingCluster, getAmbientWeatherAliases, getMostRecentDoc, bulkIndexDocuments } = require('./esClientMethods');

describe('IndexData', () => {
  let indexer;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      ping: jest.fn(),
      cat: { aliases: jest.fn() },
      search: jest.fn(),
      bulk: jest.fn(),
      count: jest.fn()
    };
    indexer = new IndexData(mockClient);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided client', () => {
      expect(indexer.client).toBe(mockClient);
      expect(indexer.dataToIndex).toEqual([]);
      expect(indexer.currentWriteIndices).toEqual([]);
      expect(indexer.dateOflatestIndexedMetricDoc).toBe('');
      expect(indexer.dateOflatestIndexedImperialDoc).toBe('');
    });
  });

  describe('dataToIndex getter/setter', () => {
    it('should set and get data array', () => {
      const data = [{ field: 'value1' }, { field: 'value2' }];
      indexer.dataToIndex = data;
      expect(indexer.dataToIndex).toEqual(data);
    });

    it('should convert single object to array', () => {
      const data = { field: 'value' };
      indexer.dataToIndex = data;
      expect(indexer.dataToIndex).toEqual([data]);
    });

    it('should handle empty array', () => {
      indexer.dataToIndex = [];
      expect(indexer.dataToIndex).toEqual([]);
    });
  });

  describe('currentWriteIndices getter/setter', () => {
    it('should set and get indices array', () => {
      const indices = ['index1', 'index2'];
      indexer.currentWriteIndices = indices;
      expect(indexer.currentWriteIndices).toEqual(indices);
    });

    it('should convert single string to array', () => {
      const index = 'single-index';
      indexer.currentWriteIndices = index;
      expect(indexer.currentWriteIndices).toEqual([index]);
    });
  });

  describe('dateOflatestIndexedMetricDoc getter/setter', () => {
    it('should set and get metric doc date', () => {
      const date = '2023-01-01T00:00:00.000Z';
      indexer.dateOflatestIndexedMetricDoc = date;
      expect(indexer.dateOflatestIndexedMetricDoc).toBe(date);
    });
  });

  describe('dateOflatestIndexedImperialDoc getter/setter', () => {
    it('should set and get imperial doc date', () => {
      const date = '2023-01-01T00:00:00.000Z';
      indexer.dateOflatestIndexedImperialDoc = date;
      expect(indexer.dateOflatestIndexedImperialDoc).toBe(date);
    });
  });

  describe('ensureConnection', () => {
    it('should return true when connection is successful', async () => {
      pingCluster.mockResolvedValue(true);

      const result = await indexer.ensureConnection();

      expect(pingCluster).toHaveBeenCalledWith(mockClient);
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      pingCluster.mockResolvedValue(false);

      const result = await indexer.ensureConnection();

      expect(result).toBe(false);
    });

    it('should handle connection errors', async () => {
      pingCluster.mockRejectedValue(new Error('Connection failed'));

      await expect(indexer.ensureConnection()).rejects.toThrow('Connection failed');
    });
  });

  describe('getActiveWriteIndices', () => {
    it('should get and set active write indices', async () => {
      const mockAliases = [
        { index: 'ambient_weather_heiligers_imperial_2023_01_01', is_write_index: 'true' },
        { index: 'ambient_weather_heiligers_metric_2023_01_01', is_write_index: 'true' },
        { index: 'ambient_weather_heiligers_imperial_2022_12_31', is_write_index: 'false' }
      ];
      
      getAmbientWeatherAliases.mockResolvedValue(mockAliases);

      const result = await indexer.getActiveWriteIndices();

      expect(getAmbientWeatherAliases).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual([
        'ambient_weather_heiligers_imperial_2023_01_01',
        'ambient_weather_heiligers_metric_2023_01_01'
      ]);
      expect(indexer.currentWriteIndices).toEqual([
        'ambient_weather_heiligers_imperial_2023_01_01',
        'ambient_weather_heiligers_metric_2023_01_01'
      ]);
    });

    it('should handle empty aliases response', async () => {
      getAmbientWeatherAliases.mockResolvedValue([]);

      const result = await indexer.getActiveWriteIndices();

      expect(result).toBeUndefined();
    });

    it('should handle no write indices', async () => {
      const mockAliases = [
        { index: 'ambient_weather_heiligers_imperial_2022_12_31', is_write_index: 'false' }
      ];
      
      getAmbientWeatherAliases.mockResolvedValue(mockAliases);

      const result = await indexer.getActiveWriteIndices();

      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      getAmbientWeatherAliases.mockRejectedValue(new Error('ES error'));

      await expect(indexer.getActiveWriteIndices()).rejects.toThrow('ES error');
    });
  });

  describe('getMostRecentIndexedDocuments', () => {
    beforeEach(() => {
      indexer.currentWriteIndices = [
        'ambient_weather_heiligers_imperial_2023_01_01',
        'ambient_weather_heiligers_metric_2023_01_01'
      ];
    });

    it('should get most recent documents for both indices', async () => {
      const mockMetricDoc = [{ _source: { dateutc: 1640891100000 } }];
      const mockImperialDoc = [{ _source: { dateutc: 1640891200000 } }];

      getMostRecentDoc
        .mockResolvedValueOnce(mockMetricDoc)
        .mockResolvedValueOnce(mockImperialDoc);

      const result = await indexer.getMostRecentIndexedDocuments();

      expect(getMostRecentDoc).toHaveBeenCalledTimes(2);
      expect(getMostRecentDoc).toHaveBeenCalledWith(
        mockClient,
        'ambient_weather_heiligers_metric_2023_01_01',
        expect.objectContaining({
          size: 1,
          _source: ['date', 'dateutc', '@timestamp'],
          sortBy: [{ field: "dateutc", direction: "desc" }],
          expandWildcards: 'all'
        })
      );
      expect(getMostRecentDoc).toHaveBeenCalledWith(
        mockClient,
        'ambient_weather_heiligers_imperial_2023_01_01',
        expect.objectContaining({
          size: 1,
          _source: ['date', 'dateutc', '@timestamp'],
          sortBy: [{ field: "dateutc", direction: "desc" }],
          expandWildcards: 'all'
        })
      );

      expect(result).toEqual({
        latestImperialDoc: mockImperialDoc,
        latestMetricDoc: mockMetricDoc
      });
      expect(indexer.dateOflatestIndexedMetricDoc).toBe(1640891100000);
      expect(indexer.dateOflatestIndexedImperialDoc).toBe(1640891200000);
    });

    it('should handle missing metric index', async () => {
      indexer.currentWriteIndices = ['ambient_weather_heiligers_imperial_2023_01_01'];

      const mockImperialDoc = [{ _source: { dateutc: 1640891200000 } }];
      getMostRecentDoc
        .mockResolvedValueOnce([{ _source: { dateutc: 1640891100000 } }])  // Still return a doc for metric
        .mockResolvedValueOnce(mockImperialDoc);

      const result = await indexer.getMostRecentIndexedDocuments();

      expect(result.latestImperialDoc).toEqual(mockImperialDoc);
      expect(indexer.dateOflatestIndexedImperialDoc).toBe(1640891200000);
    });

    it('should handle errors in document retrieval', async () => {
      getMostRecentDoc.mockRejectedValue(new Error('Document retrieval failed'));

      await expect(indexer.getMostRecentIndexedDocuments()).rejects.toThrow('Document retrieval failed');
    });
  });

  describe('bulkIndexDocuments', () => {
    beforeEach(() => {
      indexer.currentWriteIndices = [
        'ambient_weather_heiligers_imperial_2023_01_01',
        'ambient_weather_heiligers_metric_2023_01_01'
      ];
    });

    it('should bulk index documents for imperial data', async () => {
      const payload = [{ index: {} }, { field: 'value' }];
      const mockResult = { indexCounts: { count: 1 }, erroredDocuments: [] };

      bulkIndexDocuments.mockResolvedValue(mockResult);

      const result = await indexer.bulkIndexDocuments(payload, 'imperial');

      expect(bulkIndexDocuments).toHaveBeenCalledWith(
        mockClient,
        'ambient_weather_heiligers_imperial_2023_01_01',
        payload
      );
      expect(result).toBe(mockResult);
    });

    it('should bulk index documents for metric data', async () => {
      const payload = [{ index: {} }, { field: 'value' }];
      const mockResult = { indexCounts: { count: 1 }, erroredDocuments: [] };

      bulkIndexDocuments.mockResolvedValue(mockResult);

      const result = await indexer.bulkIndexDocuments(payload, 'metric');

      expect(bulkIndexDocuments).toHaveBeenCalledWith(
        mockClient,
        'ambient_weather_heiligers_metric_2023_01_01',
        payload
      );
      expect(result).toBe(mockResult);
    });

    it('should handle missing index for data type', async () => {
      indexer.currentWriteIndices = ['some_other_index'];

      const payload = [{ index: {} }, { field: 'value' }];

      await indexer.bulkIndexDocuments(payload, 'imperial');

      expect(bulkIndexDocuments).toHaveBeenCalledWith(
        mockClient,
        undefined,  // No imperial index found
        payload
      );
    });
  });

  describe('initialize', () => {
    it('should successfully initialize with connection and data', async () => {
      const mockAliases = [
        { index: 'ambient_weather_heiligers_imperial_2023_01_01', is_write_index: 'true' },
        { index: 'ambient_weather_heiligers_metric_2023_01_01', is_write_index: 'true' }
      ];
      const mockMetricDoc = [{ _source: { dateutc: 1640891100000 } }];
      const mockImperialDoc = [{ _source: { dateutc: 1640891200000 } }];

      pingCluster.mockResolvedValue(true);
      getAmbientWeatherAliases.mockResolvedValue(mockAliases);
      getMostRecentDoc
        .mockResolvedValueOnce(mockMetricDoc)
        .mockResolvedValueOnce(mockImperialDoc);

      const result = await indexer.initialize();

      expect(result).toEqual({
        latestImperialDoc: mockImperialDoc,
        latestMetricDoc: mockMetricDoc,
        outcome: 'success'
      });
    });

    it('should return no connection when ping fails', async () => {
      pingCluster.mockResolvedValue(false);

      const result = await indexer.initialize();

      expect(result).toBe('no connection');
    });

    it('should handle missing current indices', async () => {
      pingCluster.mockResolvedValue(true);
      getAmbientWeatherAliases.mockResolvedValue([]);

      const result = await indexer.initialize();

      expect(result).toEqual({
        latestImperialDoc: null,
        latestMetricDoc: null,
        outcome: 'error: no currentIndices found or non returned'
      });
    });

    it('should handle connection errors during ping', async () => {
      pingCluster.mockResolvedValue(null);

      const result = await indexer.initialize();

      expect(result).toBe('no connection');
    });

    it('should handle errors in getting write indices', async () => {
      pingCluster.mockResolvedValue(true);
      getAmbientWeatherAliases.mockRejectedValue(new Error('Aliases error'));

      await expect(indexer.initialize()).rejects.toThrow('Aliases error');
    });
  });
});