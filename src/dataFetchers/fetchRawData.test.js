const FetchRawData = require('./FetchRawData');
const momentTZ = require('moment-timezone');
const mocks = require('../../__mocks__/FetchRawData.js')

const mockAWApi = mocks.mockAWApi;
const mockFs = mocks.mockFs;

describe('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData(mockAWApi, mockFs);
    testNow = FetchRawDataTester.now;
    nowInMST = momentTZ('2020-06-10');
  });
  afterEach(() => {
    jest.restoreAllMocks();
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
  describe('class methods: extractDatesFromData', () => {
    let rawDataFetcher;
    beforeEach(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
    });
    rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
    it('extracts dates from the data', async () => {
      const testDataArray = [{ "date": "2020-07-18T18:46:00.000Z" },
      { "date": "2020-07-18T18:40:00.000Z" },
      { "date": "2020-07-18T18:35:00.000Z" },
      { "date": "2020-07-18T18:30:00.000Z" },
      { "date": "2020-07-18T18:25:00.000Z" },
      { "date": "2020-07-18T18:20:00.000Z" },
      { "date": "2020-07-18T18:15:00.000Z" },
      { "date": "2020-07-18T18:10:00.000Z" },
      { "date": "2020-07-18T18:05:00.000Z" },
      { "date": "2020-07-18T18:00:00.000Z" },
      { "date": "2020-07-18T17:55:00.000Z" }];
      const { to, from } = await rawDataFetcher.extractDatesFromData(testDataArray);
      expect(to).toBeInstanceOf(momentTZ);
      expect(from).toBeInstanceOf(momentTZ);
      expect(to.format('YYYY-MM-DDTHH:MM'))
        .toEqual(momentTZ("2020-07-18T18:40:00.000Z")
          .format('YYYY-MM-DDTHH:MM'));
      expect(from.format('YYYY-MM-DDTHH:MM'))
        .toEqual(momentTZ("2020-07-18T17:55:00.000Z")
          .format('YYYY-MM-DDTHH:MM'));
    });
  });
  describe('class methods: getLastRecordedUTCDate', () => {
    let rawDataFetcher;
    let mockedFiles = [];
    let mockedData = [];
    beforeAll(() => {
      mockFs.readdirSync.mockClear();
      mockFs.readFileSync.mockClear();
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });
    beforeEach(() => {
      const resp = `./data/ambient-weather-heiligers-imperial`;
      mockedFiles = ['20200717-T-1055.json', '20200718-T-1055.json'];
      mockedData = [{ date: '2020-07-17T17:55:00.000Z' }, { date: '2020-07-18T17:55:00.000Z' }];
    })
    it('extracts the dates from the saved data and returns the most recent date data was saved for', async () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedFiles);
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify([mockedData[0]])).mockReturnValueOnce(JSON.stringify([mockedData[1]]));
      const result = await rawDataFetcher.getLastRecordedUTCDate('ambient-weather-heiligers-imperial');
      expect(Object.keys(result)).toEqual(["mostRecentDate", "allFilesDates"]);
      expect(JSON.stringify(result.mostRecentDate)).toEqual(JSON.stringify('2020-07-18T17:55:00.000Z'));
    });
    it('works when there are no files', async () => {
      mockFs.readdirSync.mockImplementationOnce(() => []);
      const result = await rawDataFetcher.getLastRecordedUTCDate('ambient-weather-heiligers-imperial');
      console.log('result', result)
      expect(JSON.stringify(result.mostRecentDate.format('YYYY-MM-DD'))).toEqual(JSON.stringify(momentTZ.utc(momentTZ().subtract(1, 'days')).format('YYYY-MM-DD')));
      expect(result.allFilesDates).toEqual([]);
    })
  });
  describe('class methods: fetchRecentData', () => {
    let rawDataFetcher;
    beforeEach(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
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
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    })
    it("should extract the min and max dates for an array of data containing dates", () => {
      const from1 = "2020-06-19";
      const from2 = "2020-06-21";
      const testArray = [{ date: from1 }, { date: from2 }];
      expect(rawDataFetcher.extractDatesFromData(testArray)).toEqual({
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
      expect(rawDataFetcher.extractDatesFromData(days).from.format('YYYY-MM-DD')).toEqual(startOfWeek.format('YYYY-MM-DD'));
      expect(rawDataFetcher.extractDatesFromData(days).to.format('YYYY-MM-DD')).toEqual(endOfWeek.format('YYYY-MM-DD'));
    });
    it('calls fetchRecentData with date and record count provided', async () => {
      const mockedData = [
        { "date": "2020-06-29T22:00:00.000Z" },
        { "date": "2020-06-29T21:55:00.000Z" },
        { "date": "2020-06-29T21:50:00.000Z" },
        { "date": "2020-06-29T21:45:00.000Z" },
        { "date": "2020-06-29T21:40:00.000Z" },
        { "date": "2020-06-29T21:35:00.000Z" },
        { "date": "2020-06-29T21:30:00.000Z" }
      ];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData('2020-06-30', 1);
      expect(rawDataFetcher.fetchRecentData).toHaveBeenCalled();
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][0]).toBe('2020-06-30')
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][1]).toBe(1)
      expect(rawDataFetcher.fetchRecentData.mock.results[0].value).toEqual(mockedData)

      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('data/ambient-weather-heiligers-imperial/20200629-T-2130_20200629-T-2200.json')
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
      const mockedData = [
        { "date": "2020-06-29T12:00:00.000Z" },
        { "date": "2020-06-29T11:55:00.000Z" },
        { "date": "2020-06-29T11:50:00.000Z" },
        { "date": "2020-06-29T11:45:00.000Z" },
        { "date": "2020-06-29T11:40:00.000Z" },
        { "date": "2020-06-29T11:35:00.000Z" },
        { "date": "2020-06-29T11:30:00.000Z" }
      ];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      const result = await rawDataFetcher.fetchAndStoreData('2020-06-29', 1);
      expect(result.from).toEqual(momentTZ("2020-06-29T11:30:00.000Z"))
      expect(result.to).toEqual(momentTZ("2020-06-29T12:00:00.000Z"))
      expect(result.to > result.from).toBeTruthy
      spy.mockRestore();
    });
    it('dynamically sets the filename based on the max date from the data', async () => {
      const mockedData = [{ date: '2020-06-29' }, { date: '2020-06-30' }];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData('2020-06-30', 1);
      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('data/ambient-weather-heiligers-imperial/20200629-T-1130_20200629-T-1200.json')
      expect(mockFs.writeFileSync.mock.calls[0][0]).not.toBe('data/ambient-weather-heiligers-imperial/20200629-T-1201_1201.json')
      spy.mockRestore();
    });
  });
  describe('class methods: getDataForDateRanges', () => {
    let rawDataFetcher;
    beforeAll(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      mockFs.writeFileSync.mockClear();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    })
    it("fetches data for a date", async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'getLastRecordedUTCDate').mockImplementation((path) => ({ mostRecentDate: '2020-07-18T17:55:00Z', allFilesDates: new Set(["2020-07-18T17:55:00Z"]) }));
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData').mockImplementation((date, numberOfRecords) => {
        return {
          from: momentTZ('2020-07-18'),
          to: momentTZ('2020-07-18').add((288 * 5), 'minutes'),
        }
      });
      const result = await rawDataFetcher.getDataForDateRanges('2020-07-19');
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(1);
      expect(result[0].from.format('YYYY-MM-DD')).toEqual('2020-07-18')
      expect(result[0].to.format('YYYY-MM-DD')).toEqual('2020-07-19')
    });
    it("fetches data if no date is provided", async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'getLastRecordedUTCDate').mockImplementation((path) => ({ mostRecentDate: '2020-07-18T17:55:00Z', allFilesDates: new Set(["2020-07-18T17:55:00Z"]) }));
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData').mockImplementation((date, numberOfRecords) => {
        return {
          from: momentTZ('2020-07-18'),
          to: momentTZ('2020-07-18').add((288 * 5), 'minutes'),
        }
      });
      const result = await rawDataFetcher.getDataForDateRanges('2020-07-19');
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(1);
      expect(result[0].from.format('YYYY-MM-DD')).toEqual('2020-07-18')
      expect(result[0].to.format('YYYY-MM-DD')).toEqual('2020-07-19')
    });
    it("fetches data in batches if the date range is more than 1 day", async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'getLastRecordedUTCDate').mockImplementation((path) => ({ mostRecentDate: '2020-07-15T17:55:00.000Z', allFilesDates: new Set(['2020-07-15T17:55:00.000Z']) }));
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData')
        .mockImplementationOnce(() => {
          return { from: momentTZ('2020-07-19T17:55:00-07:00'), to: momentTZ('2020-07-18T17:55:00-07:00') }
        })
        .mockImplementationOnce(() => {
          return { from: momentTZ('2020-07-18T17:50:00-07:00'), to: momentTZ('2020-07-17T17:55:00-07:00') }
        })
        .mockImplementationOnce(() => {
          return { from: momentTZ('2020-07-17T17:50:00-07:00'), to: momentTZ('2020-07-16T17:55:00-07:00') }
        })
        .mockImplementationOnce(() => {
          return { from: momentTZ('2020-07-16T17:50:00-07:00'), to: momentTZ('2020-07-15T17:55:00-07:00') }
        });
      const result = await rawDataFetcher.getDataForDateRanges('2020-07-19');
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(4);
      const fromDates = result.map(resultItem => resultItem.from.format('YYYY-MM-DD'))
      const toDates = result.map(resultItem => resultItem.to.format('YYYY-MM-DD'))
      expect(fromDates).toEqual(['2020-07-19', '2020-07-18', '2020-07-17', '2020-07-16'])
      expect(toDates).toEqual(['2020-07-18', '2020-07-17', '2020-07-16', '2020-07-15'])
    });
    it('works if a date is not provided', async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      const result = await rawDataFetcher.getDataForDateRanges();
      expect(result).toBeTruthy
    });
    it('Does not work:checks if the minimum time has passed since storing data', async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'getLastRecordedUTCDate').mockImplementation((path) => '2020-07-18T17:55:00.000Z');
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData').mockImplementation((a, b) => {
        return { from: momentTZ('2020-07-18T17:55:00-07:00'), to: momentTZ('2020-07-19T17:50:00-07:00') }
      });
      const result = await rawDataFetcher.getDataForDateRanges('2020-07-18T17:55:00.000Z');
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(0);
    })
  });
});

