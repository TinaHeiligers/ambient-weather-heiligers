
const momentTZ = require('moment-timezone');
const {
  calcMinutesDiff,
  timeConstants
} = require('../utils');
const Logger = require('../logger');
const AW_CONSTANTS = {
  dataInterval: 5,
  maxNumRecords: 288,
}

const fetchRawDataLogger = new Logger('fetchRawData');
/*
 * Fetches data from Ambient-Weather
 * All dates should be in utc
 * args:
 * awAPi AW API REST application
 * fs: file-system
 * returns: an array of dates for which data was retrieved
 */
class FetchRawData {
  #pathToFiles = 'ambient-weather-heiligers-imperial';
  #now = (new Date()).getTime();
  #numberOfRecords = 0;
  #datesArray = [];
  #allUniqueDates = [];
  #failedDatesForDataFetch = [];
  #recentDataFileNames = []; // array of filename strings for the data fetched during the run.
  #skipSave = false;
  constructor(awApi, fs) {
    this.AWApi = awApi;
    this.fs = fs;
  }
  get numberOfRecords() {
    return this.#numberOfRecords;
  }
  set numberOfRecords(num) {
    this.#numberOfRecords = num;
  }
  get datesArray() {
    return this.#datesArray;
  }
  set datesArray(newArray) {
    this.#datesArray = newArray;
  }
  get allUniqueDates() {
    return this.#allUniqueDates;
  }
  set allUniqueDates(newArray) {
    this.#allUniqueDates = [...new Set(newArray)];
  }
  get failedDatesForDate() {
    return this.#failedDatesForDataFetch;
  }
  set failedDatesForDate(newArray) {
    this.#failedDatesForDataFetch = newArray;
  }
  get now() {
    return this.#now;
  }
  set now(date) {
    this.#now = date;
  }
  get pathToFiles() {
    return this.#pathToFiles;
  }
  get recentDataFileNames() {
    return this.#recentDataFileNames;
  }
  set recentDataFileNames(fileNames) {
    this.#recentDataFileNames = Array.isArray(fileNames) ? this.#recentDataFileNames.concat(fileNames) : this.#recentDataFileNames.concat([fileNames]);
  }
  get skipSave() {
    return this.#skipSave;
  }
  set skipSave(bool) {
    this.#skipSave = !!bool;
  }

  clearFileNames() {
    if (this.#recentDataFileNames && this.#recentDataFileNames.length > 0) {
      fetchRawDataLogger.logInfo(`clearing ${this.recentDataFileNames.length()} file names`);
      this.#recentDataFileNames = [];
    } else {
      fetchRawDataLogger.logWarning(`No filenames to clear`)
    }
  }
  /**
   *
   * @param {array} dataArray: dates as date-time since unix epoch time in utc
   * @returns {obj} { from, to } min, max from dataArray as date-time integers since unix epoch
   */
  extractDatesFromData = (dataArray) => {
    const dataDates = dataArray.map((datum) => datum.dateutc);
    return { from: Math.min(...dataDates), to: Math.max(...dataDates) };
  };

  addDateEntries(dateArray) {
    let uniqueDates = [... new Set(dateArray)];
    this.allUniqueDates = uniqueDates;
  };
  /**
   *
   * @param {array} files : array of files that have been read from a path to a folder
   * @returns {array} array of unix timestamps
   */
  extractUniqueDatesFromFiles(pathToFolder) {
    let allDates = [];
    const files = this.fs.readdirSync(`data/${pathToFolder}`);
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file === '.DS_Store') return;
        const dataFromFile = JSON.parse(this.fs.readFileSync(`data/${pathToFolder}/${file}`));
        const datesFromSingleFile = dataFromFile.map(datum => datum.dateutc).filter(datum => datum !== undefined);
        allDates = allDates.concat(datesFromSingleFile);
      });
      return [...new Set(allDates)];
    }
    return [...new Set(allDates)];
  };

  getLastRecordedUTCDate = (allDatesFromFiles) => {
    const uniqueUtcDatesArray = [...new Set(allDatesFromFiles)];
    return Math.max(...uniqueUtcDatesArray);
  }
  /**
   * The AWApi call uses the from date and counts backwards (numRecords * 5 min) in time to fetch data.
   * @param {integer} from: date-time as integer of Unix time in milliseconds since epoch
   * @param {integer} numRecords: number of records to fetch
   * @returns {array} if the device is available: array of json data containing the raw data from the AWApi call, else undefined
   * @example
   [{ "dateutc": 1641683700000, "tempinf": 71.2, "humidityin": 39,...},
    { "dateutc": 1641683400000, "tempinf": 71.2, "humidityin": 39, ...}]
   */
  async fetchRecentData(from, numRecords) {
    const devices = await this.AWApi.userDevices();
    if (devices && devices.length > 0) {
      try {
        return await this.AWApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
      } catch (err) {
        fetchRawDataLogger.logError('[FetchRawData: fetchRecentData] [ERROR]', err)
        throw err;
      }
    } else {
      return;
    }
  }
  /**
   *
   * @param {array} dataArray : array of json data returdned from `fetchRecentData`
   * @returns {array} new data that we don't already have on file (dependency is that we do not call for new data over a time range that we don't have local data for stored on file)
   */
  addNewDataDatesToUniqueDataEntries = (dataArray) => {
    const actualNewDataEntries = dataArray.filter(entry => !this.allUniqueDates.includes(entry?.dateutc));
    const newDatesItems = [...new Set(actualNewDataEntries.map(newEntry => newEntry?.dateutc))].concat(this.allUniqueDates)
    this.allUniqueDates = newDatesItems;
    return actualNewDataEntries;
  }
  /**
   *
   * @param {integer} toDate date-time in milliseconds since the Unix epoch time
   * @param {integer} numRecords number of records to fetch from API (max = 288, min = 1)
   * @returns {obj} { from, to }: date-times as milliseconds since Unix epoch time for which data was fetched
   */
  async fetchAndStoreData(toDate, numRecords) {
    try {
      const result = await this.fetchRecentData(toDate, numRecords);
      // console.log('the result from fetching the most recent data is:', result)
      if (result && Array.isArray(result) && result.length > 0) {
        const actualNewDataEntries = this.addNewDataDatesToUniqueDataEntries(result)
        // setting up to store data in files
        const { from, to } = this.extractDatesFromData(actualNewDataEntries);
        const formattedFileName = `${from}_${to}`; // BREAKING CHANGE: uses integers now
        this.recentDataFileNames = formattedFileName;
        if (!this.skipSave) {
          this.fs.writeFileSync(`data/${this.pathToFiles}/${formattedFileName}.json`, JSON.stringify(actualNewDataEntries, null, 2));
        }
        return ({ from, to });
      }
      return null;
    } catch (err) {
      fetchRawDataLogger.logError('[FetchRawData: fetchAndStoreData] [ERROR] error in fetchAndStoreData', err)
      throw err;
    }
  }
  /**
   * main method for FetchRawData class: fetches data that we don't yet have on file up to fromDate
   * @param {boolean} skipSave: saving to file is skipped if true
   * @param {integer} fromDate: date until which to fetch new data for (calls are made going back in time)
   * @returns {obj} { dataFetchForDates: <array>, dataFileNames: <array } array of date-times in milliseconds since epoch, array of filenames where the data was/>would have been stored
   */
  // main function for this class
  async getDataForDateRanges(skipSave = false, fromDate) {

    if (!fromDate) {
      fromDate = this.now;
    }
    fetchRawDataLogger.logInfo('[FetchRawData: getDataForDateRanges] args: skipSave, fromDate', { skipSave: !!skipSave, fromDate: fromDate });
    const dayBeforeNow = this.now - timeConstants.one_day_as_milliseconds;
    this.skipSave = skipSave;
    // this is all setup before I can start fetching the data
    const allDatesFromFiles = this.extractUniqueDatesFromFiles(this.pathToFiles);
    const dateOfLastDataSaved = (allDatesFromFiles && allDatesFromFiles.length > 0)
      ? this.getLastRecordedUTCDate(allDatesFromFiles)
      : dayBeforeNow;
    // set the unique dates entry set to the class instance
    this.allUniqueDates = allDatesFromFiles;

    const minSinceLastData = Math.floor((fromDate - dateOfLastDataSaved) / (timeConstants.milliseconds_per_second * timeConstants.seconds_per_minute));
    // return early if it's too soon to fetch new data
    if (minSinceLastData < AW_CONSTANTS.dataInterval) return 'too early';
    const estTotalNumRecordsToFetch = Math.floor(minSinceLastData / AW_CONSTANTS.dataInterval);
    const estNumberOfBatches = estTotalNumRecordsToFetch / AW_CONSTANTS.maxNumRecords;
    // multi-day data fetch

    if (estNumberOfBatches >= 1) {
      fetchRawDataLogger.logInfo('[FetchRawData: getDataForDateRanges] [multi-day fetch] Setting up batched requests for batches:', { estNumberOfBatches: Math.floor(estNumberOfBatches) })
      this.numberOfRecords = AW_CONSTANTS.maxNumRecordsCanGet;
      for (let i = 0; i < Math.floor(estNumberOfBatches); i++) {
        fetchRawDataLogger.logInfo('[FetchRawData: getDataForDateRanges] [multi-day fetch] Issueing batch request:', { i: i })
        try {
          const resultDatesObject = await this.fetchAndStoreData(this.now, this.numberOfRecords);
          if (resultDatesObject) {
            const { from, to } = resultDatesObject;
            this.now = from;
            this.datesArray = this.datesArray.concat({ from, to });
          } else {
            this.failedDatesForDate = this.failedDatesForDate.concat(this.now);
            break;
          }
        } catch (err) {
          fetchRawDataLogger.logError('[FetchRawData: getDataForDateRanges] [multi-day fetch] PROBLEM!', err)
        }
      }
      // fetch the last lot of data that doesn't fall into a batch
      const lastRecordsFromDate = Math.min(...this.datesArray.map((entry) => entry.from));
      const lastRecordsLimit = Math.floor(calcMinutesDiff(lastRecordsFromDate, dateOfLastDataSaved) / AW_CONSTANTS.dataInterval)
      fetchRawDataLogger.logInfo('[FetchRawData: getDataForDateRanges] [multi-day fetch] Setting up final collection for record count:', { lastRecordsLimit: lastRecordsLimit });
      const resultDatesObject = await this.fetchAndStoreData(lastRecordsFromDate, lastRecordsLimit);
      if (resultDatesObject) {
        const { from, to } = resultDatesObject;
        this.datesArray = this.datesArray.concat({ from, to })
        const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
        return finalResult;
      } else {
        const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
        return finalResult;
      }
    } else {
      // single day data fetch
      try {
        fetchRawDataLogger.logInfo('[FetchRawData: getDataForDateRanges] [single-day fetch] Fewer than a 288-batch records required. Setting up request for records count:', { estTotalNumRecordsToFetch: estTotalNumRecordsToFetch })
        const result = await this.fetchAndStoreData(this.now, estTotalNumRecordsToFetch);
        this.datesArray = this.datesArray.concat(result)

        const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
        return finalResult;
      } catch (err) {
        fetchRawDataLogger.logError('[FetchRawData: getDataForDateRanges] [single-day fetch] PROBLEM!', err)
      }
    }
    const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
    return finalResult;
  };
}
module.exports = FetchRawData;
