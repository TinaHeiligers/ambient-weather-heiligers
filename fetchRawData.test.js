const FetchRawData = require('./FetchRawData');
const momentTZ = require('moment-timezone');

describe('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  let nowInMST;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData();
    testNow = FetchRawDataTester.now;
    nowInMST = momentTZ();
  });
  test('gets the number of records', () => {
    expect(FetchRawDataTester.numberOfRecords).toBe(0);
  });
  test('it sets the number of records', () => {
    FetchRawDataTester.numberOfRecords = 1;
    expect(FetchRawDataTester.numberOfRecords).toBe(1);
  });
  test('it gets the dates array', () => {
    expect(FetchRawDataTester.datesArray).toEqual(expect.arrayContaining([]))
  });
  test('it sets the dates array', () => {
    const newArray = [1, 2, 3];
    FetchRawDataTester.datesArray = newArray;
    expect(FetchRawDataTester.datesArray).toEqual(expect.arrayContaining(newArray))
  });
  test('it gets the date time at instantiation', () => {
    expect(FetchRawDataTester.now).toEqual(testNow)
  });
  test('it sets the initial "now" in uct that is static in time', () => {
    const dateTimeInUTC = testNow;
    const dateTimeInMST = nowInMST;
    const formatString = 'YYYY-MM-DD HH:mm:ss Z';
    expect(FetchRawDataTester.now).toEqual(momentTZ.utc(testNow));
    expect(FetchRawDataTester.now.format(formatString)).not.toEqual(dateTimeInMST.format(formatString));
    jest.useFakeTimers();
    setTimeout(() => {
      expect(FetchRawDataTester.now).toEqual(testNow)
    }, 15000);
    jest.runAllTimers();
  });

})

