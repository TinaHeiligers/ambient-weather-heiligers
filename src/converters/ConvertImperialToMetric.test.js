const ConvertImperialToMetric = require('./ConvertImperialToMetric');

const mockFs = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  openSync: jest.fn(),
  appendFileSync: jest.fn(),
  closeSync: jest.fn(),
};

describe('ConvertImperialToMetric', () => {
  let convertImperialToMetricTester;
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
  describe.skip('class methods: convertFiles', () => {
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
      const result = convertImperialToMetricTester.convertFiles([mockedData]);
      expect(result).toEqual(true);
      expect(mockFs.appendFileSync).toHaveBeenCalledTimes(1)
      expect(mockFs.closeSync).toHaveBeenCalledTimes(1)
    });
    it('does not fail if the file does not have contents', () => {
      const result = convertImperialToMetricTester.convertFiles([{}]);
      expect(result).toBeTruthy();
    });
    it('does not fail if the file contains an emty entry', () => {
      const result = convertImperialToMetricTester.convertFiles([{ "date": "2020-07-18T18:46:00.000Z" }, {},
      { "date": "2020-07-18T18:40:00.000Z" }]);
      expect(result).toBeTruthy();
    });
  });
  // Here I need to test the entire process as one function
  describe.skip('class methods: convertRawImperialDataToJsonl', () => {
    let mockedJsonlFiles = ['20200717-T-1055.jsonl', '20200718-T-1055.jsonl'];
    let mockedJsonFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '20200719-T-1055.json'];
    const mockedData = [
      { "date": "2020-07-18T18:46:00.000Z" },
      { "date": "2020-07-18T18:40:00.000Z" }
    ];
    it('converts json files to jsonl files', () => {
      convertImperialToMetricTester = new ConvertImperialToJsonl(mockFs);
      mockFs.readdirSync.mockClear();
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
      expect(convertImperialToMetricTester.convertRawImperialDataToJsonl()).toEqual(['20200719-T-1055']);
      jest.restoreAllMocks();
    });
    it('works if there are no files to convert', () => {
      convertImperialToMetricTester = new ConvertImperialToJsonl(mockFs);
      mockFs.readdirSync.mockReset();
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
      expect(convertImperialToMetricTester.convertRawImperialDataToJsonl()).toEqual([]);
      jest.restoreAllMocks();
    });
  });
});
