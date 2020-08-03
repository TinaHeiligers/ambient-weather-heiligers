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
    it('gets the the path to the json annd jsonl files', () => {
      expect(ConvertImperialToJsonlTester.pathToJsonFiles).toEqual('ambient-weather-heiligers-imperial');
      expect(ConvertImperialToJsonlTester.pathToJsonlFiles).toEqual('ambient-weather-heiligers-imperial-jsonl');

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
  // describe('class methods: getArrayOfFiles', () => {
  //   let converted;
  //   beforeEach(() => {
  //     mockFs.readdirSync.mockClear();
  //     mockPath.join.mockClear();
  //   });
  //   converted = new ConvertImperialToJsonlTester(mockFs, mockPath);
  //   it('gets the filenames from the files', () => {
  //     const testJsonlFilesArray = [];
  //     const { to, from } = await converted.extractDataInfo(testDataArray);
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

