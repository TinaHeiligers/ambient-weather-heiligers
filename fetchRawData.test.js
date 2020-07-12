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
const mockFs = {
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn()
}
const mockPath = {
  join: jest.fn()
}

describe('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData(goodMock, mockFs, mockPath);
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
    it("gets the failed dates array for data that wasn't fetched", () => {
      const newArray = ['2020-06-30', '2020-06-29'];
      expect(FetchRawDataTester.failedDatesForDate).toEqual([])
      FetchRawDataTester.failedDatesForDate = newArray;
      expect(FetchRawDataTester.failedDatesForDate).toEqual(newArray)
    })
    it("sets the failed dates array for data that wasn't fetched", () => {
      let originalArray = FetchRawDataTester.failedDatesForDate;
      FetchRawDataTester.failedDatesForDate = ['2020-06-30'];
      expect(FetchRawDataTester.failedDatesForDate).not.toEqual(originalArray)
      expect(FetchRawDataTester.failedDatesForDate).toEqual(['2020-06-30'])
    })
  });
  describe('class methods: fetchRecentData', () => {
    let rawDataFetcher;
    beforeEach(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs, mockPath);
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
  });
  describe('class methods: fetchAndStoreData', () => {
    let rawDataFetcher;
    beforeAll(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      mockFs.writeFileSync.mockClear();
      mockPath.join.mockClear();
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs, mockPath);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    })
    it("should extract the min and max dates for an array of data containing dates", () => {
      const from1 = "2020-06-19";
      const from2 = "2020-06-21";
      const testArray = [{ date: from1 }, { date: from2 }];
      expect(rawDataFetcher.extractDataInfo(testArray)).toEqual({
        from: momentTZ(from1),
        to: momentTZ(from2),
      });
    });
    it("should extract the min and max dates for an array of data containing dates for a week", () => {
      let days = [];
      let startOfWeek = momentTZ('2020-07-12').startOf('week');
      let endOfWeek = momentTZ('2020-07-18').endOf('week');
      let day = startOfWeek;
      while (day <= endOfWeek) {
        days.push({ date: day.toDate() });
        day = day.clone().add(1, 'd');
      }
      expect(rawDataFetcher.extractDataInfo(days).from.format('YYYY-MM-DD')).toEqual(startOfWeek.format('YYYY-MM-DD'));
      expect(rawDataFetcher.extractDataInfo(days).to.format('YYYY-MM-DD')).toEqual(endOfWeek.format('YYYY-MM-DD'));
    });
    it('calls fetchRecentData with date and record count provided', async () => {
      const mockedData = [{ date: '2020-06-29 00:01' }, { date: '2020-06-30 00:01' }];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData('2020-06-30', 1);
      expect(rawDataFetcher.fetchRecentData).toHaveBeenCalled();
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][0]).toBe('2020-06-30')
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][1]).toBe(1)
      expect(rawDataFetcher.fetchRecentData.mock.results[0].value).toEqual(mockedData)

      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('./data/ambient-weather-heiligers-imperial/20200630-T-1201.json')
      expect(mockFs.writeFileSync.mock.calls[0][1]).toBe(JSON.stringify(mockedData, null, 2))
      expect(mockFs.writeFileSync.mock.results[0].value).toBe(undefined)
      spy.mockRestore();
    });
    it('returns nothing if there the response is empty', async () => {
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce((a, b) => [])
      const result = await rawDataFetcher.fetchAndStoreData('2040-06-30', 1);
      expect(result).toBe(null);
      spy.mockRestore();
    });
    it('extracts the min and max date from the data and returns that', async () => {
      const mockedData = [{ date: '2020-06-29 00:01' }, { date: '2020-06-30 00:01' }];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      const result = await rawDataFetcher.fetchAndStoreData('2020-06-30', 1);
      expect(result.from).toEqual(momentTZ('2020-06-29 00:01'))
      expect(result.to).toEqual(momentTZ('2020-06-30 00:01'))
      expect(result.to > result.from).toBeTruthy
      spy.mockRestore();
    });
    it('dynamically sets the filename based on the max date from the data', async () => {
      const mockedData = [{ date: '2020-06-29' }, { date: '2020-06-30' }];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData('2020-06-30', 1);
      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('./data/ambient-weather-heiligers-imperial/20200630-T-1201.json')
      expect(mockFs.writeFileSync.mock.calls[0][0]).not.toBe('./data/ambient-weather-heiligers-imperial/20200629-T-1201.json')
      spy.mockRestore();
    });
  });
});
describe('class methods: getDataForDateRanges', () => {
  let rawDataFetcher;
  beforeAll(() => {
    mockAWApi.userDevices.mockClear();
    mockAWApi.deviceData.mockClear();
    mockFs.writeFileSync.mockClear();
    rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  })
  it.todo('takes a date');
  it.todo('sets a date if one isn\t provided.');
  it.todo('Does not work:checks if the minimum time has passed since storing data')
  it.todo('batches the data to fetch')
  it.todo('goes through the batches and fetches data')
  it.todo('gets the remaining records that don\'t fit into a batch')
  it.todo('gets all the records if there are fewer records to fetch than a batch')
  it.todo('returns an array of dates for the data that was fetched')
});
