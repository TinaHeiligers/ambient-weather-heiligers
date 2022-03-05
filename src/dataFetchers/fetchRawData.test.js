const FetchRawData = require('./FetchRawData');
const momentTZ = require('moment-timezone');
const mocks = require('../../__mocks__/FetchRawData.js')
const { timeConstants } = require('../utils');

const mockAWApi = mocks.mockAWApi;
const mockFs = mocks.mockFs;


describe('FetchRawData', () => {
  let FetchRawDataTester;
  let testNow;
  beforeAll(() => {
    FetchRawDataTester = new FetchRawData(mockAWApi, mockFs);
    testNow = FetchRawDataTester.now;
    nowInMST = (Date.parse('2020-06-10'))
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
      const dateTimeInMST = ((new Date()).getTime() / (timeConstants.milliseconds_per_second))
      expect(FetchRawDataTester.now).toEqual(testNow);
      expect(FetchRawDataTester.now).not.toEqual(dateTimeInMST);
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
    });
    it("sets the failed dates array for data that wasn't fetched", () => {
      let originalArray = FetchRawDataTester.failedDatesForDate;
      FetchRawDataTester.failedDatesForDate = ['2020-06-30'];
      expect(FetchRawDataTester.failedDatesForDate).not.toEqual(originalArray)
      expect(FetchRawDataTester.failedDatesForDate).toEqual(['2020-06-30'])
    });
    it.todo('adds tests for recentDataFileNames')
    it.todo('adds tests for skipSave')
  });
  describe('class methods: extractDatesFromData', () => {
    let rawDataFetcher;
    beforeEach(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
    });
    rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
    it('extracts dates from the data', async () => {
      const dateArray = [{ "date": "2020-07-18T18:46:00.000Z" },
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
      const testDataArray = dateArray.map(entry => ({ ...entry, dateutc: (Date.parse(entry.date)) }));
      const { to, from } = await rawDataFetcher.extractDatesFromData(testDataArray);
      expect(typeof to).toBe("number");
      expect(typeof from).toBe("number");
      expect(to).toEqual((Date.parse(dateArray[0].date)))
      expect(from).toEqual(Date.parse(dateArray[dateArray.length - 1].date))
    });
  });
  describe('class methods: extractUniqueDatesFromFiles', () => {
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
      mockedFiles = ['20200717-T-1055.json', '20200718-T-1055.json', '1641684000000_1641752460000.json', '1641752700000_1641839100000.json'];
      mockedData = [{ dateutc: '1595008500000' }, { dateutc: '1595094900000' }, { dateutc: '1641684000000' }, { dateutc: '1641752700000' }];
    })
    it('extracts the dates from the saved data and returns the most recent date data was saved for', async () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedFiles);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([mockedData[0]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[1]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[2]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[3]]));
      const result = await rawDataFetcher.extractUniqueDatesFromFiles('ambient-weather-heiligers-imperial');
      const expected = mockedData.map(item => item.dateutc);
      expect(result).toEqual(expected);
    });
    it('returns an empty array if no files are present', async () => {
      mockFs.readdirSync.mockImplementationOnce(() => undefined);
      mockFs.readFileSync.mockReturnValueOnce()
      const result = await rawDataFetcher.extractUniqueDatesFromFiles('ambient-weather-heiligers-imperial');
      expect(result).toEqual([]);
    });
    it('filters out any undefined dates', async () => {
      mockFs.readdirSync.mockImplementationOnce(() => mockedFiles);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify([mockedData[0]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[1]]))
        .mockReturnValueOnce(JSON.stringify([mockedData[2]]))
        .mockReturnValueOnce(JSON.stringify([]));
      const result = await rawDataFetcher.extractUniqueDatesFromFiles('ambient-weather-heiligers-imperial');
      expect(result).toEqual(['1595008500000', '1595094900000', '1641684000000']);
    });
  });
  describe('class methods: getLastRecordedUTCDate', () => {
    let rawDataFetcher;
    beforeAll(() => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      rawDataFetcher.now = (Date.parse('2022-01-10'))
    });
    it('returns the most recent entry from an array of date-times', async () => {
      let testData = [1595008500000, 1595094900000, 1641684000000, 1641752700000];
      const result = await rawDataFetcher.getLastRecordedUTCDate(testData);
      expect(typeof result).toBe("number")
      expect(result).toEqual(1641752700000);
    });
    it('works when there are no dates', async () => {
      const result = await rawDataFetcher.getLastRecordedUTCDate([]);
      expect(result).toEqual((Date.parse('2022-01-09')));
    });

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
    });
    it('does not call deviceData if userDevices does not return a value', async () => {
      const deviceDataSpy = jest.spyOn(mockAWApi, 'deviceData');
      mockAWApi.userDevices.mockReturnValueOnce(false);
      const result = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(mockAWApi.userDevices).toHaveBeenCalled();
      expect(deviceDataSpy).not.toHaveBeenCalled();
    });
    it('accepts two args: a date in UTC and the number of records to fetch', async () => {
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }]);
      mockAWApi.deviceData.mockReturnValueOnce([{ data: { date: Date.parse(nowInMST).toString() } }])
      const data = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(data).toBeTruthy();
    });
    it('returns an array of data', async () => {
      mockAWApi.userDevices.mockReturnValueOnce([{
        macAddress: "F4:CF:A2:CD:9B:12"
      }]);
      mockAWApi.deviceData.mockReturnValueOnce([{ data: { date: Date.parse(nowInMST).toString() } }])
      const data = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(data.length).toEqual(1)
    });
    it('returns undefined if the userDevices does not return a value', async () => {
      mockAWApi.userDevices.mockReturnValueOnce(false);
      const result = await rawDataFetcher.fetchRecentData(nowInMST, 1);
      expect(mockAWApi.userDevices).toHaveBeenCalled();
      expect(result).toBe(undefined);
    });
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
    it('calls fetchRecentData with date and record count provided', async () => {
      const fromDate = (Date.parse('2020-06-30'))
      const mockedData = [
        { "date": "2020-06-29T22:00:00.000Z" },
        { "date": "2020-06-29T21:55:00.000Z" },
        { "date": "2020-06-29T21:50:00.000Z" },
        { "date": "2020-06-29T21:45:00.000Z" },
        { "date": "2020-06-29T21:40:00.000Z" },
        { "date": "2020-06-29T21:35:00.000Z" },
        { "date": "2020-06-29T21:30:00.000Z" }
      ].map((entry => ({ ...entry, dateutc: (Date.parse(entry.date)) })));
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData(fromDate, 1);
      expect(rawDataFetcher.fetchRecentData).toHaveBeenCalled();
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][0]).toBe(fromDate)
      expect(rawDataFetcher.fetchRecentData.mock.calls[0][1]).toBe(1)
      expect(rawDataFetcher.fetchRecentData.mock.results[0].value).toEqual(mockedData)

      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('data/ambient-weather-heiligers-imperial/1593466200000_1593468000000.json')
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
      const fromDate = (Date.parse('2020-06-29'))
      const mockedData = [
        { "date": "2020-06-29T12:00:00.000Z" },
        { "date": "2020-06-29T11:55:00.000Z" },
        { "date": "2020-06-29T11:50:00.000Z" },
        { "date": "2020-06-29T11:45:00.000Z" },
        { "date": "2020-06-29T11:40:00.000Z" },
        { "date": "2020-06-29T11:35:00.000Z" },
        { "date": "2020-06-29T11:30:00.000Z" }
      ].map((entry => ({ ...entry, dateutc: (Date.parse(entry.date)) })));;
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      const result = await rawDataFetcher.fetchAndStoreData(fromDate, 1);
      expect(result.from).toEqual(mockedData[mockedData.length - 1].dateutc)
      expect(result.to).toEqual(mockedData[0].dateutc)
      expect(result.to > result.from).toBeTruthy
      spy.mockRestore();
    });
    it('dynamically sets the filename based on the max date from the data', async () => {
      const mockedData = [{ dateutc: (Date.parse('2020-06-29')) }, { dateutc: (Date.parse('2020-06-30')) }];
      let spy = jest.spyOn(rawDataFetcher, 'fetchRecentData').mockImplementationOnce(() => mockedData);
      await rawDataFetcher.fetchAndStoreData((Date.parse('2020-06-30')), 1);
      spy = jest.spyOn(mockFs, 'writeFileSync').mockImplementationOnce(() => true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync.mock.calls[0][0]).toBe('data/ambient-weather-heiligers-imperial/1593430200000_1593432000000.json')
      expect(mockFs.writeFileSync.mock.calls[0][0]).not.toBe('data/ambient-weather-heiligers-imperial/20200629-T-1201_1201.json')
      spy.mockRestore();
    });
  });
  describe('class methods: getDataForDateRanges', () => {
    let rawDataFetcher;
    const setDate = (Date.parse('2020-07-19'));
    let defaultArgs = {
      skipSave: false,
      fromDate: setDate,
    }
    beforeAll(() => {
      mockAWApi.userDevices.mockClear();
      mockAWApi.deviceData.mockClear();
      mockFs.writeFileSync.mockClear();
    });
    afterEach(() => {
      jest.restoreAllMocks();
    })
    it("fetches data for a specified end date", async () => {
      const mockedFrom = Date.parse(momentTZ('2020-07-18'));
      const mockedTo = Date.parse(momentTZ('2020-07-18').add((288 * 5), 'minutes'));
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'extractUniqueDatesFromFiles').mockImplementation((path) => ([Date.parse("2020-07-18T17:55:00Z")]));
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData').mockImplementation((date, numberOfRecords) => {
        return {
          from: mockedFrom,
          to: mockedTo,
        }
      });
      const result = await rawDataFetcher.getDataForDateRanges(defaultArgs.skipSave, defaultArgs.fromDate);
      expect(rawDataFetcher.extractUniqueDatesFromFiles).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(1);
      expect(Object.keys(result)).toStrictEqual(["dataFetchForDates", "dataFileNames"]);
      expect(result.dataFetchForDates).toEqual([{ from: mockedFrom, to: mockedTo }]);
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
      const result = await rawDataFetcher.getDataForDateRanges(false, '2020-07-19');
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(1);
      expect(result.dataFetchForDates[0].from.format('YYYY-MM-DD')).toEqual('2020-07-18')
      expect(result.dataFetchForDates[0].to.format('YYYY-MM-DD')).toEqual('2020-07-19')
    });
    it("fetches data in batches if the date range is more than 1 day", async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      const mockedDates = {
        from: [
          '2020-07-19T17:55:00-07:00', '2020-07-18T17:50:00-07:00', '2020-07-17T17:50:00-07:00', '2020-07-16T17:50:00-07:00'
        ],
        to: [
          '2020-07-18T17:55:00-07:00', '2020-07-17T17:55:00-07:00', '2020-07-16T17:55:00-07:00', '2020-07-15T17:55:00-07:00'
        ]
      }
      const mockedFrom = mockedDates.from.map(date => Date.parse(momentTZ(date)));
      const mockedTo = mockedDates.to.map(date => Date.parse(momentTZ(date)));
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest
        .spyOn(rawDataFetcher, 'extractUniqueDatesFromFiles')
        .mockImplementation((path) => new Set([Date.parse('2020-07-15T17:55:00.000Z')]));

      jest
        .spyOn(rawDataFetcher, 'fetchAndStoreData')
        .mockImplementationOnce(() => ({
          from: mockedFrom[0], to: mockedTo[0]
        }))
        .mockImplementationOnce(() => ({
          from: mockedFrom[1], to: mockedTo[1]
        }))
        .mockImplementationOnce(() => ({
          from: mockedFrom[2], to: mockedTo[2]
        }))
        .mockImplementationOnce(() => ({
          from: mockedFrom[3], to: mockedTo[3]
        }));

      const result = await rawDataFetcher.getDataForDateRanges(false, Date.parse('2020-07-19'));
      expect(rawDataFetcher.extractUniqueDatesFromFiles).toHaveBeenCalled();
      // expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(4);
      const fromDates = result.dataFetchForDates.map(resultItem => resultItem.from)
      const toDates = result.dataFetchForDates.map(resultItem => resultItem.to)
      expect(fromDates).toEqual(mockedFrom)
      expect(toDates).toEqual(mockedTo)
    });
    it('works if a date is not provided', async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      const result = await rawDataFetcher.getDataForDateRanges();
      expect(result).toBeTruthy
    });
    it('does not fetch new data if the minimum time of 5 min has not elapsed', async () => {
      rawDataFetcher = new FetchRawData(mockAWApi, mockFs);
      // mock return value of rawDataFetcher.getLastRecordedUTCDate
      jest.spyOn(rawDataFetcher, 'getLastRecordedUTCDate').mockImplementation((path) => Date.parse('2020-07-18T17:55:00.000Z'));
      jest.spyOn(rawDataFetcher, 'fetchAndStoreData').mockImplementation((a, b) => {
        return { from: Date.parse(momentTZ('2020-07-18T17:55:00-07:00')), to: Date.parse(momentTZ('2020-07-19T17:50:00-07:00')) }
      });
      const result = await rawDataFetcher.getDataForDateRanges(false, Date.parse('2020-07-18T17:55:00.000Z'));
      expect(rawDataFetcher.getLastRecordedUTCDate).toHaveBeenCalled();
      expect(rawDataFetcher.fetchAndStoreData.mock.calls.length).toEqual(0);
    })
  });
});

