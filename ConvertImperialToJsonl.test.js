const ConvertImperialToJsonl = require('./ConvertImperialToJsonl');
const convert = require('convert-units');


const mockFs = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  openSync: jest.fn(),
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
  describe('class methods: getArrayOfFiles', () => {
    let mockedJsonlFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedJsonFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    beforeEach(() => {
      mockFs.readdirSync.mockClear();
      mockPath.join.mockClear();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('gets the filenames from the files', () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedJsonlFiles).mockImplementationOnce(() => mockedJsonFiles)
      const jsonlResult = convertImperialToJsonlTester.getArrayOfFiles('jsonl');
      expect(jsonlResult).toEqual(['20200717-T-1055', '20200718-T-1055']);
      const jsonResult = convertImperialToJsonlTester.getArrayOfFiles('json');
      expect(jsonResult).toEqual(['20200717-T-1055', '20200718-T-1055', '20200719-T-1055']);
    });
    it('does not fail if there are no files', () => {
      mockFs.readdirSync.mockImplementationOnce(() => [])
      const jsonlResult = convertImperialToJsonlTester.getArrayOfFiles('jsonl');
      expect(jsonlResult).toEqual([]);
    });
  });
  describe('class methods: convertFiles', () => {
    const mockedData = [
      { "date": "2020-07-18T18:46:00.000Z" },
      { "date": "2020-07-18T18:40:00.000Z" }
    ];
    beforeEach(() => {
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([mockedData[0]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[1]]));
      mockFs.openSync
        .mockImplementationOnce(() => 1).mockImplementationOnce(() => 2);
      mockFs.appendFileSync
        .mockImplementationOnce(() => JSON.stringify(mockedData[0]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedData[1]) + "\n");
      mockFs.closeSync
        .mockImplementation(() => true);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('writes json file entries to a new file with line delimiting', () => {
      const result = convertImperialToJsonlTester.convertFiles([mockedData]);
      expect(result).toEqual(true);
      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(1)
      expect(mockFs.closeSync).toHaveBeenCalledTimes(1)
    });
    it('does not fail if the file does not have contents', () => {
      const result = convertImperialToJsonlTester.convertFiles([{}]);
      expect(result).toBeTruthy();
    });
    it('does not fail if the file contains an emty entry', () => {
      const result = convertImperialToJsonlTester.convertFiles([{ "date": "2020-07-18T18:46:00.000Z" }, {},
      { "date": "2020-07-18T18:40:00.000Z" }]);
      expect(result).toBeTruthy();
    });
  });
  describe('class methods: convertRawImperialDataToJsonl', () => {
    let mockedJsonlFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedJsonFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    const mockedData = [
      { "date": "2020-07-18T18:46:00.000Z" },
      { "date": "2020-07-18T18:40:00.000Z" }
    ];
    it('converts json files to jsonl files', () => {
      convertImperialToJsonlTester = new ConvertImperialToJsonl(mockFs, mockPath);
      mockFs.readdirSync.mockClear();
      mockPath.join.mockClear();
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([mockedData[0]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[1]]));
      mockFs.openSync
        .mockImplementationOnce(() => 1).mockImplementationOnce(() => 2);
      mockFs.appendFileSync
        .mockImplementationOnce(() => JSON.stringify(mockedData[0]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedData[1]) + "\n");
      mockFs.closeSync
        .mockImplementation(() => true);
      mockFs.readdirSync.mockImplementationOnce(() => mockedJsonlFiles).mockImplementationOnce(() => mockedJsonFiles)
      expect(convertImperialToJsonlTester.convertRawImperialDataToJsonl()).toEqual(['20200719-T-1055']);
      jest.restoreAllMocks();
    });
    it('works if there are no files to convert', () => {
      convertImperialToJsonlTester = new ConvertImperialToJsonl(mockFs, mockPath);
      mockFs.readdirSync.mockReset();
      mockPath.join.mockReset();
      mockFs.readdirSync.mockReset();
      mockFs.readFileSync.mockReset();
      mockFs.openSync.mockReset();
      mockFs.appendFileSync.mockReset();
      mockFs.closeSync.mockReset();
      mockedJsonl = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
      mockedJson = ['20200717-T-1055.json', '20200718-T-1055.json'];
      mockFs.readdirSync
        .mockImplementationOnce(() => mockedJsonl)
        .mockImplementationOnce(() => mockedJson)
      expect(convertImperialToJsonlTester.convertRawImperialDataToJsonl()).toEqual([]);
      jest.restoreAllMocks();
    });
  });
});
