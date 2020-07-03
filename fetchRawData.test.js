const FetchRawData = require('./FetchRawData');
const momentTZ = require('moment-timezone');

const failingMock = {
  userDevices: function () {
    throw 'fail';
  },
  deviceData: function () {
    throw 'fail';
  }
};

const goodMock = {
  userDevices: function () {
    return [{
      macAddress: "F4:CF:A2:CD:9B:12",
      lastData: {
        dateutc: 1590176760000,
        tz: "America/Phoenix",
        date: "2020-05-22T19:46:00.000Z"
      },
      info: {
        name: "Heiligers Weather Station",
        coords: {
          geo: {
            type: "Point",
            coordinates: [
              -111.7421359,
              33.3560276
            ]
          },
          elevation: 386.7543029785156,
          location: "Gilbert",
          address: "2225 E Vaughn Ave, Gilbert, AZ 85234, USA",
          coords: {
            lon: -111.7421359,
            lat: 33.3560276
          }
        }
      }
    }];
  },
  deviceData: function () {
    return [{ data: { date: new Date().toString() } }];
  }
};

const mockAWApi = {
  userDevices: jest.fn(),
  deviceData: jest.fn()
};

describe.only('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData(goodMock);
    testNow = FetchRawDataTester.now;
    nowInMST = momentTZ('2020-06-10');
  });
  describe('FetchRawData getters and setters', () => {
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
    it('it gets the initial "now" in uct that is static in time', () => {
      const dateTimeInMST = momentTZ();
      const formatString = 'YYYY-MM-DD HH:mm:ss Z';
      expect(FetchRawDataTester.now).toEqual(momentTZ.utc(testNow));
      expect(FetchRawDataTester.now.format(formatString)).not.toEqual(dateTimeInMST.format(formatString));
      jest.useFakeTimers();
      setTimeout(() => {
        expect(FetchRawDataTester.now).toEqual(testNow)
      }, 15000);
      jest.runAllTimers();
    });
    it('it sets the initial "now" in uct that is static in time', () => {
      const newDateTimeinUTC = momentTZ.utc(testNow).subtract(1, 'days');
      FetchRawDataTester.now = newDateTimeinUTC;
      const formatString = 'YYYY-MM-DD HH:mm:ss Z';
      expect(FetchRawDataTester.now).toEqual(newDateTimeinUTC);
      expect(FetchRawDataTester.now.format(formatString)).toEqual(newDateTimeinUTC.format(formatString));
      jest.useFakeTimers();
      setTimeout(() => {
        expect(FetchRawDataTester.now).toEqual(newDateTimeinUTC)
      }, 15000);
      jest.runAllTimers();
    });
    it('should get the path to the data files', () => {
      expect(FetchRawDataTester.pathToFiles).toEqual('ambient-weather-heiligers-imperial');
    });
  });
  describe.only('class methods: fetchRecentData', () => {
    let rawDataFetcher;
    beforeEach(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      rawDataFetcher = new FetchRawData(mockAWApi);
    });
    it('waits for AWApi.userDevices to return a value then calls deviceData', async () => {
      const deviceDataSpy = jest.spyOn(mockAWApi, 'deviceData');
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }])
      await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(mockAWApi.userDevices).toHaveBeenCalled();
      expect(deviceDataSpy).toHaveBeenCalled();
    })
    it('does not call deviceData if userDevices does not return a value', async () => {
      const deviceDataSpy = jest.spyOn(mockAWApi, 'deviceData');
      mockAWApi.userDevices.mockReturnValueOnce(false);
      // const rawDataFetcher = new FetchRawData(mockAWApi);
      await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(mockAWApi.userDevices).toHaveBeenCalled();
      expect(deviceDataSpy).not.toHaveBeenCalled();
    })
    it('accepts two args: a date in UTC and the number of records to fetch', async () => {
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }])
      mockAWApi.deviceData.mockReturnValueOnce([{ data: { date: new Date(nowInMST).toString() } }])
      const data = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(data).toBeTruthy();
    });
    it('returns an array of data', async () => {
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }])
      mockAWApi.deviceData.mockReturnValueOnce([{ data: { date: new Date(nowInMST).toString() } }])
      const data = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(data.length).toEqual(1)
    })
    it.skip('retrys the fetch if an error code of 429 of too many requests is thrown', async () => {
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }])
      mockAWApi.deviceData.mockImplementation(() => {
        throw new Error({ statusCode: 429 })
      });
      rawDataFetcher.retry.mockimplementation = (a, b) => jest.fn();
      const retrySpy = jest.spyOn(rawDataFetcher, 'retry');
      const result = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(retrySpy).toHaveBeenCalled();
    })
  });
  describe('class methods: fetchAndStoreData', () => {
    it.todo('works without arguments');
  })
  describe('class methods: extractDataInfo', () => {
    it.todo('acccepts an array of data');
    it.todo('extracts the min and max dates from all the data');
  });
});

  // extractDataInfo
  // retry
  // fetchAndStoreData
  // getDataForDateRanges
