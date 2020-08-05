const ConvertImperialToJsonl = require('./ConvertImperialToJsonl');


const mockFs = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  closeSync: jest.fn(),
};

const mockPath = {
  join: jest.fn()
};

describe.only('ConvertImperialToJsonl', () => {
  let convertImperialToJsonlTester;
  beforeAll(() => {
    convertImperialToJsonlTester = new ConvertImperialToJsonl(mockFs, mockPath);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('ConvertImperialToJsonl getters and setters', () => {
    it('gets the the path to jsonl files', () => {
      expect(convertImperialToJsonlTester.pathToJsonlFiles).toEqual('ambient-weather-heiligers-imperial-jsonl');
    });
    it('gets the the path to the json annd jsonl files', () => {
      expect(convertImperialToJsonlTester.pathToJsonFiles).toEqual('ambient-weather-heiligers-imperial');
      expect(convertImperialToJsonlTester.pathToJsonlFiles).toEqual('ambient-weather-heiligers-imperial-jsonl');

    });
    it('it gets the array of files', () => {
      expect(convertImperialToJsonlTester.allJsonFilesArray).toEqual(expect.arrayContaining([]))
      expect(convertImperialToJsonlTester.filesConvertedToJsonl).toEqual(expect.arrayContaining([]))
    });
    it('it gets the array of files', () => {
      const newArray = ['item1.jsonl', 'item2.jsonl'];
      convertImperialToJsonlTester.allJsonFilesArray = newArray;
      convertImperialToJsonlTester.filesConvertedToJsonl = newArray;
      expect(convertImperialToJsonlTester.allJsonFilesArray).toEqual(expect.arrayContaining(newArray))
      expect(convertImperialToJsonlTester.filesConvertedToJsonl).toEqual(expect.arrayContaining(newArray))
    });
    it('it sets and gets the convertedCount', () => {
      convertImperialToJsonlTester.convertedCount = 10;
      expect(convertImperialToJsonlTester.convertedCount).toEqual(10);
      convertImperialToJsonlTester.convertedCount = 0;
      expect(convertImperialToJsonlTester.convertedCount).toEqual(0);
    });
  });
  describe.only('class methods: getArrayOfFiles', () => {
    let mockedJsonlFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedJsonFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    beforeEach(() => {
      mockFs.readdirSync.mockClear();
      mockPath.join.mockClear();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    })
    it('gets the filenames from the files', () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedJsonlFiles).mockImplementationOnce(() => mockedJsonFiles)
      const jsonlResult = convertImperialToJsonlTester.getArrayOfFiles('jsonl');
      expect(jsonlResult).toEqual(['20200717-T-1055', '20200718-T-1055']);
      const jsonResult = convertImperialToJsonlTester.getArrayOfFiles('json');
      expect(jsonResult).toEqual(['20200717-T-1055', '20200718-T-1055', '20200719-T-1055']);
    });
  });
});

