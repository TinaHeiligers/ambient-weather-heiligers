const ConvertImperialToMetric = require('./ConvertImperialToMetric');
const { mockedImperialData, mockedMetricData } = require('./convertImperialToMetricFixtures');

const mockFs = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  openSync: jest.fn(),
  appendFileSync: jest.fn(),
  closeSync: jest.fn(),
};

describe('ConvertImperialToMetric', () => {
  let convertImperialToMetricTester;
  let imperialDataMock = mockedImperialData;
  let metricDataMock = mockedMetricData;
  beforeAll(() => {
    convertImperialToMetricTester = new ConvertImperialToMetric(mockFs);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('ConvertImperialToJsonl getters and setters', () => {
    it('gets the the path to jsonl files', () => {
      expect(convertImperialToMetricTester.pathToImperialDataFiles).toEqual('ambient-weather-heiligers-imperial');
    });
    it('gets the the path to the json annd jsonl files', () => {
      expect(convertImperialToMetricTester.pathToMetricJsonlFiles).toEqual('ambient-weather-heiligers-metric-jsonl');
      expect(convertImperialToMetricTester.pathToImperialDataFiles).toEqual('ambient-weather-heiligers-imperial');

    });
    it('it gets the array of files', () => {
      expect(convertImperialToMetricTester.allMetricJsonlFilesArray).toEqual(expect.arrayContaining([]))
      expect(convertImperialToMetricTester.dataFilesConvertedToMetricJsonl).toEqual(expect.arrayContaining([]))
    });
    it('it gets the array of files', () => {
      const newArray = ['item1.jsonl', 'item2.jsonl'];
      convertImperialToMetricTester.allMetricJsonlFilesArray = newArray;
      convertImperialToMetricTester.dataFilesConvertedToMetricJsonl = newArray;
      expect(convertImperialToMetricTester.allMetricJsonlFilesArray).toEqual(expect.arrayContaining(newArray))
      expect(convertImperialToMetricTester.dataFilesConvertedToMetricJsonl).toEqual(expect.arrayContaining(newArray))
    });
    it('it sets and gets the convertedCount', () => {
      convertImperialToMetricTester.convertedToMetricCount = 10;
      expect(convertImperialToMetricTester.convertedToMetricCount).toEqual(10);
      convertImperialToMetricTester.convertedToMetricCount = 0;
      expect(convertImperialToMetricTester.convertedToMetricCount).toEqual(0);
    });
  });
  describe('class methods: getArrayOfFiles', () => {
    let mockedMetricJsonlFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedImperialJsonFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    beforeEach(() => {
      mockFs.readdirSync.mockClear();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('gets the filenames from the files', () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedMetricJsonlFiles).mockImplementationOnce(() => mockedImperialJsonFiles)
      const metricJsonlResult = convertImperialToMetricTester.getArrayOfFiles('jsonl');
      expect(metricJsonlResult).toEqual(['20200717-T-1055', '20200718-T-1055']);
      const imperialJsonResult = convertImperialToMetricTester.getArrayOfFiles('json');
      expect(imperialJsonResult).toEqual(['20200717-T-1055', '20200718-T-1055', '20200719-T-1055']);
    });
    it('does not fail if there are no files', () => {
      mockFs.readdirSync.mockImplementationOnce(() => [])
      const metricJsonlResult = convertImperialToMetricTester.getArrayOfFiles('jsonl');
      expect(metricJsonlResult).toEqual([]);
    });
  });
  // here I need to test that the data is converted from Imperial to Metric Units
  describe('class methods: convertDataAndWriteJsonlFile', () => {
    beforeEach(() => {
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([imperialDataMock[0]]))
        .mockReturnValueOnce(JSON.stringify([imperialDataMock[1]]))
        .mockReturnValueOnce(JSON.stringify([imperialDataMock[2]]));
      mockFs.openSync
        .mockImplementationOnce(() => 1).mockImplementationOnce(() => 3);
      mockFs.appendFileSync
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[0]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[1]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[2]) + "\n");
      mockFs.closeSync
        .mockImplementation(() => true);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    it('writes json file entries to a new file with line delimiting', () => {
      const result = convertImperialToMetricTester.convertDataAndWriteJsonlFile([imperialDataMock]);
      expect(result).toEqual(true);
      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(1)
      expect(mockFs.closeSync).toHaveBeenCalledTimes(1)
    });
    it('does not fail if the file does not have contents', () => {
      const result = convertImperialToMetricTester.convertDataAndWriteJsonlFile([{}]);
      expect(result).toBeTruthy();
    });
    it('does not fail if the file contains an emty entry', () => {
      const result = convertImperialToMetricTester.convertDataAndWriteJsonlFile([imperialDataMock[0], {},
      imperialDataMock[2]]);
      expect(result).toBeTruthy();
    });
  });
  // Here I need to test the entire process as one function
  describe('class methods: convertRawImperialDataToJsonl', () => {
    let mockedMetricFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedImperialFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    const mockedImperialData = imperialDataMock;
    const mockedMetricData = metricDataMock;
    it('converts json files to jsonl files', () => {
      convertImperialToMetricTester = new ConvertImperialToMetric(mockFs);
      mockFs.readdirSync.mockClear();
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([mockedImperialData[0]]))
        .mockReturnValueOnce(JSON.stringify([mockedImperialData[1]]))
        .mockReturnValueOnce(JSON.stringify([mockedImperialData[2]]));
      mockFs.openSync
        .mockImplementationOnce(() => 1).mockImplementationOnce(() => 2);
      mockFs.appendFileSync
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[0]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[1]) + "\n")
        .mockImplementationOnce(() => JSON.stringify(mockedMetricData[2]) + "\n");
      mockFs.closeSync
        .mockImplementation(() => true);
      mockFs.readdirSync
        .mockImplementationOnce(() => mockedMetricFiles)
        .mockImplementationOnce(() => mockedImperialFiles);
      expect(convertImperialToMetricTester.convertImperialDataToMetricJsonl()).toEqual(['20200719-T-1055']);
      jest.restoreAllMocks();
    });
    it('works if there are no files to convert', () => {
      convertImperialToMetricTester = new ConvertImperialToMetric(mockFs);
      mockFs.readdirSync.mockReset();
      mockFs.readdirSync.mockReset();
      mockFs.readFileSync.mockReset();
      mockFs.openSync.mockReset();
      mockFs.appendFileSync.mockReset();
      mockFs.closeSync.mockReset();
      mockedMetric = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
      mockedImperial = ['20200717-T-1055.json', '20200718-T-1055.json'];
      mockFs.readdirSync
        .mockImplementationOnce(() => mockedMetric)
        .mockImplementationOnce(() => mockedImperial)
      expect(convertImperialToMetricTester.convertImperialDataToMetricJsonl()).toEqual([]);
      jest.restoreAllMocks();
    });
  });
});
