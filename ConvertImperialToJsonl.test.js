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
  let ConvertImperialToJsonlTester;
  beforeAll(() => {
    ConvertImperialToJsonlTester = new ConvertImperialToJsonl(mockFs, mockPath);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('ConvertImperialToJsonl getters and setters', () => {
    it('gets the the path to jsonl files', () => {
      expect(ConvertImperialToJsonlTester.pathToJsonlFiles).toEqual('ambient-weather-heiligers-imperial-jsonl');
    });
    it('gets the the path to json files', () => {
      expect(ConvertImperialToJsonlTester.pathToJsonFiles).toEqual('ambient-weather-heiligers-imperial');
    });
    it('it gets the array of files', () => {
      expect(ConvertImperialToJsonlTester.allJsonFilesArray).toEqual(expect.arrayContaining([]))
      expect(ConvertImperialToJsonlTester.filesConvertedToJsonl).toEqual(expect.arrayContaining([]))
    });
    it('it gets the array of files', () => {
      const newArray = ['item1.jsonl', 'item2.jsonl'];
      ConvertImperialToJsonlTester.allJsonFilesArray = newArray;
      ConvertImperialToJsonlTester.filesConvertedToJsonl = newArray;
      expect(ConvertImperialToJsonlTester.allJsonFilesArray).toEqual(expect.arrayContaining(newArray))
      expect(ConvertImperialToJsonlTester.filesConvertedToJsonl).toEqual(expect.arrayContaining(newArray))
    });
    it('it sets and gets the convertedCount', () => {
      ConvertImperialToJsonlTester.convertedCount = 10;
      expect(ConvertImperialToJsonlTester.convertedCount).toEqual(10);
      ConvertImperialToJsonlTester.convertedCount = 0;
      expect(ConvertImperialToJsonlTester.convertedCount).toEqual(0);
    });
  });
  // describe('class methods: extractDataInfo', () => {
  //   let rawDataFetcher;
  //   beforeEach(() => {
  //     mockAWApi.userDevices.mockClear();
  //     mockAWApi.deviceData.mockClear();
  //   });
  //   rawDataFetcher = new FetchRawData(mockAWApi, mockFs, mockPath);
  //   it('extracts dates from the data', async () => {
  //     const testDataArray = [{ "date": "2020-07-18T18:46:00.000Z" },
  //     { "date": "2020-07-18T18:40:00.000Z" },
  //     { "date": "2020-07-18T18:35:00.000Z" },
  //     { "date": "2020-07-18T18:30:00.000Z" },
  //     { "date": "2020-07-18T18:25:00.000Z" },
  //     { "date": "2020-07-18T18:20:00.000Z" },
  //     { "date": "2020-07-18T18:15:00.000Z" },
  //     { "date": "2020-07-18T18:10:00.000Z" },
  //     { "date": "2020-07-18T18:05:00.000Z" },
  //     { "date": "2020-07-18T18:00:00.000Z" },
  //     { "date": "2020-07-18T17:55:00.000Z" }];
  //     const { to, from } = await rawDataFetcher.extractDataInfo(testDataArray);
  //     expect(to).toBeInstanceOf(momentTZ);
  //     expect(from).toBeInstanceOf(momentTZ);
  //     expect(to.format('YYYY-MM-DDTHH:MM'))
  //       .toEqual(momentTZ("2020-07-18T18:40:00.000Z")
  //         .format('YYYY-MM-DDTHH:MM'));
  //     expect(from.format('YYYY-MM-DDTHH:MM'))
  //       .toEqual(momentTZ("2020-07-18T17:55:00.000Z")
  //         .format('YYYY-MM-DDTHH:MM'));
  //   });
  // });
});

