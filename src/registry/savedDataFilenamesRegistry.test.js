const Registry = require('./savedDataFilenamesRegistry');

describe('Registry', () => {
  let registry;
  let mockFs;

  beforeEach(() => {
    mockFs = {
      readdirSync: jest.fn()
    };
    registry = new Registry(mockFs);
  });

  describe('constructor', () => {
    it('should initialize with provided filesystem', () => {
      expect(registry.fs).toBe(mockFs);
    });

    it('should initialize with empty arrays', () => {
      expect(registry.allFileNames).toEqual([]);
      expect(registry.readAllFileNames).toEqual([]);
      expect(registry.todoAllFileNames).toEqual([]);
    });
  });

  describe('allFileNames getter/setter', () => {
    it('should add a single file to allFileNames', () => {
      registry.allFileNames = 'file1.json';
      expect(registry.allFileNames).toEqual(['file1.json']);
    });

    it('should add an array of files to allFileNames', () => {
      registry.allFileNames = ['file1.json', 'file2.json'];
      expect(registry.allFileNames).toEqual(['file1.json', 'file2.json']);
    });

    it('should concatenate files when called multiple times', () => {
      registry.allFileNames = 'file1.json';
      registry.allFileNames = ['file2.json', 'file3.json'];
      expect(registry.allFileNames).toEqual(['file1.json', 'file2.json', 'file3.json']);
    });
  });

  describe('readAllFileNames getter/setter', () => {
    it('should add a single file to readAllFileNames', () => {
      registry.readAllFileNames = 'file1.json';
      expect(registry.readAllFileNames).toEqual(['file1.json']);
    });

    it('should add an array of files to readAllFileNames', () => {
      registry.readAllFileNames = ['file1.json', 'file2.json'];
      expect(registry.readAllFileNames).toEqual(['file1.json', 'file2.json']);
    });

    it('should concatenate files when called multiple times', () => {
      registry.readAllFileNames = 'file1.json';
      registry.readAllFileNames = ['file2.json', 'file3.json'];
      expect(registry.readAllFileNames).toEqual(['file1.json', 'file2.json', 'file3.json']);
    });
  });

  describe('todoAllFileNames getter/setter', () => {
    it('should calculate todo files correctly', () => {
      registry.allFileNames = ['file1.json', 'file2.json', 'file3.json'];
      registry.readAllFileNames = ['file2.json'];
      
      registry.todoAllFileNames = null; // trigger calculation
      expect(registry.todoAllFileNames).toEqual(['file1.json', 'file3.json']);
    });

    it('should return empty array when all files are read', () => {
      registry.allFileNames = ['file1.json', 'file2.json', 'file3.json'];
      registry.readAllFileNames = ['file1.json', 'file2.json', 'file3.json'];
      
      registry.todoAllFileNames = null;
      expect(registry.todoAllFileNames).toEqual([]);
    });
  });

  describe('retrieveAllFileNames', () => {
    it('should read files from default directory', () => {
      const mockFiles = ['file1.json', 'file2.json'];
      mockFs.readdirSync.mockReturnValue(mockFiles);

      const result = registry.retrieveAllFileNames();

      expect(mockFs.readdirSync).toHaveBeenCalledWith('data/ambient-weather-heiligers-imperial');
      expect(result).toEqual(mockFiles);
      expect(registry.allFileNames).toEqual(mockFiles);
    });

    it('should read files from custom directory', () => {
      const mockFiles = ['custom1.json', 'custom2.json'];
      mockFs.readdirSync.mockReturnValue(mockFiles);

      const result = registry.retrieveAllFileNames('custom-folder');

      expect(mockFs.readdirSync).toHaveBeenCalledWith('data/custom-folder');
      expect(result).toEqual(mockFiles);
      expect(registry.allFileNames).toEqual(mockFiles);
    });

    it('should handle empty directory', () => {
      mockFs.readdirSync.mockReturnValue([]);

      const result = registry.retrieveAllFileNames();

      expect(result).toEqual([]);
      expect(registry.allFileNames).toEqual([]);
    });

    it('should handle filesystem errors', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Directory not found');
      });

      expect(() => registry.retrieveAllFileNames()).toThrow('Directory not found');
    });
  });

  describe('retrieveFileNamesForCount', () => {
    beforeEach(() => {
      registry.allFileNames = [
        '20220101-T-1000.json',
        '20220102-T-1000.json',
        '20210101-T-1000.json',
        '20210102-T-1000.json',
        '20200101-T-1000.json'
      ];
    });

    it('should return files for default year (2022) and count (10)', () => {
      const result = registry.retrieveFileNamesForCount();
      expect(result).toEqual(['20220101-T-1000.json', '20220102-T-1000.json']);
    });

    it('should return files for specific year', () => {
      const result = registry.retrieveFileNamesForCount(10, '2021');
      expect(result).toEqual(['20210101-T-1000.json', '20210102-T-1000.json']);
    });

    it('should limit results by count', () => {
      const result = registry.retrieveFileNamesForCount(1, '2022');
      expect(result).toEqual(['20220101-T-1000.json']);
    });

    it('should return empty array for non-existent year', () => {
      const result = registry.retrieveFileNamesForCount(10, '2019');
      expect(result).toEqual([]);
    });

    it('should handle count larger than available files', () => {
      const result = registry.retrieveFileNamesForCount(100, '2021');
      expect(result).toEqual(['20210101-T-1000.json', '20210102-T-1000.json']);
    });

    it('should handle zero count', () => {
      const result = registry.retrieveFileNamesForCount(0, '2022');
      expect(result).toEqual([]);
    });
  });

  describe('run', () => {
    it('should retrieve all filenames and return files for 2021', () => {
      const mockFiles = [
        '20210101-T-1000.json',
        '20210102-T-1000.json',
        '20220101-T-1000.json'
      ];
      mockFs.readdirSync.mockReturnValue(mockFiles);

      const result = registry.run();

      expect(mockFs.readdirSync).toHaveBeenCalledWith('data/ambient-weather-heiligers-imperial');
      expect(result).toEqual(['20210101-T-1000.json', '20210102-T-1000.json']);
    });

    it('should handle empty directory in run', () => {
      mockFs.readdirSync.mockReturnValue([]);

      const result = registry.run();

      expect(result).toEqual([]);
    });
  });
});