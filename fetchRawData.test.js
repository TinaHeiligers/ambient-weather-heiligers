const FetchRawData = require('./FetchRawData');
const momentTZ = require('moment-timezone');

describe.only('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  let nowInMST;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData();
    testNow = FetchRawDataTester.now;
    nowInMST = momentTZ();
  });
  describe.only('FetchRawData getters and setters', () => {
    it('gets the number of records', () => {
      expect(FetchRawDataTester.numberOfRecords).toBe(0);
    });
    it('it sets the number of records', () => {
      FetchRawDataTester.numberOfRecords = 1;
      expect(FetchRawDataTester.numberOfRecords).toBe(1);
    });
    it('it gets the dates array', () => {
      expect(FetchRawDataTester.datesArray).toEqual(expect.arrayContaining([]))
    });
    it('it sets the dates array', () => {
      const newArray = [1, 2, 3];
      FetchRawDataTester.datesArray = newArray;
      expect(FetchRawDataTester.datesArray).toEqual(expect.arrayContaining(newArray))
    });
    it('it gets the date time at instantiation', () => {
      expect(FetchRawDataTester.now).toEqual(testNow)
    });
    it('it sets the initial "now" in uct that is static in time', () => {
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
    it.todo('should get the path to the data files');
    it.todo('should get the minimum time between new data might be available');
  });
  describe('class methods: fetchRecentData', () => {
    it.todo('excepts two args: a date in UTC and the number of records to fetch');
    it.todo('works without arguments');
    it.todo('checks that the device responds -> need a mock for awApi.userDevices');
    it.todo('fetchs data from the api with the args provided -> need a mock awApi.deviceData')
    it.todo('returns an array of data')
  })
});

