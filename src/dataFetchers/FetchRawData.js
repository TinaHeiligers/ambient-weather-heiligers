const {
  calcMinutesDiff,
  timeConstants
} = require('../utils');
const Logger = require('../logger');
const AW_CONSTANTS = {
  dataInterval: 5,
  maxNumRecords: 288,
}

const fetchRawDataLogger = new Logger('[FetchRawData]');
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
   * @param pathToFiles {string} directory path to files to read
   * @returns {set/array} array of unique unix datetime integers in milliseconds. The array can be empty!
   */
  extractUniqueDatesFromFiles(pathToFiles) {
    let allDates = [];
    const files = this.fs.readdirSync(`data/${pathToFiles}`);
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (file === '.DS_Store') return;
        const dataReadFromFile = this.fs.readFileSync(`data/${pathToFiles}/${file}`);
        // handle the tricky case when all the file contains is an empty array
        if (dataReadFromFile !== undefined) {
          const parsedDataFromFile = JSON.parse(dataReadFromFile);
          const datesFromSingleFile = (parsedDataFromFile && parsedDataFromFile.length > 0) ? parsedDataFromFile.map(datum => datum.dateutc) : [];
          allDates = allDates.concat(datesFromSingleFile);
        } else {
          fetchRawDataLogger.logWarning('[extractUniqueDatesFromFiles] [WARNING] file with no entries:', file)
        }
      });
      return [...new Set(allDates)];
    }
    return [...new Set(allDates)];
  };
  /**
   *
   * @param {array} allDatesFromFiles: array of date-time integers since Unix epoch in milliseconds
   * @returns {number} the most recent date-time for which we have data on file. Defaults to 1 day ago from present time if the array is empty
   */

  getLastRecordedUTCDate = (allDatesFromFiles = this.allUniqueDates) => {
    console.log('In getLastRecordedUTCDate')
    if (allDatesFromFiles.length > 0 && allDatesFromFiles.every(item => typeof item === "number")) {
      const uniqueUtcDatesArray = [...new Set(allDatesFromFiles)];
      return Math.max(...uniqueUtcDatesArray);
    } else {
      return (this.now - timeConstants.one_day_as_milliseconds);
    }
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
        fetchRawDataLogger.logError('[fetchRecentData] [ERROR]', err)
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
      fetchRawDataLogger.logError('[fetchAndStoreData] [ERROR] error in fetchAndStoreData', err)
      throw err;
    }
  }
  /**
   * main method for FetchRawData class: fetches data that we don't yet have on file up to fromDate
   * @param {boolean} skipSave: saving to file is skipped if true
   * @param {integer} fromDate: date until which to fetch new data for (calls are made going back in time)
   * @returns {obj | string} { dataFetchForDates: <array>, dataFileNames: <array } | "too early" if less than 5 min has passed between the current time and the most recent datetime on file
   array of date-times in milliseconds since epoch, array of filenames where the data was/would have been stored
   */
  // main function for this class
  async getDataForDateRanges(skipSave = true, fromDate) {

    if (!fromDate) {
      fromDate = this.now;
      console.log('setting fromDate to now')
    }
    fetchRawDataLogger.logInfo('[getDataForDateRanges] args: skipSave, fromDate', { skipSave: !!skipSave, fromDate: fromDate });

    this.skipSave = skipSave;
    // this is all setup before I can start fetching the data

    // set the unique dates entry set to the class instance
    this.allUniqueDates = this.extractUniqueDatesFromFiles(this.pathToFiles);
    const dateOfLastDataSaved = this.getLastRecordedUTCDate();
    const minSinceLastData = Math.floor((fromDate - dateOfLastDataSaved) / (timeConstants.milliseconds_per_second * timeConstants.seconds_per_minute));
    // return early if it's too soon to fetch new data
    if (minSinceLastData < AW_CONSTANTS.dataInterval) {
      fetchRawDataLogger.logInfo('[getDataForDateRanges] too early', { minSinceLastData: minSinceLastData, minInterval: AW_CONSTANTS.dataInterval })
      return 'too early';
    }
    const estTotalNumRecordsToFetch = Math.floor(minSinceLastData / AW_CONSTANTS.dataInterval);
    const estNumberOfBatches = estTotalNumRecordsToFetch / AW_CONSTANTS.maxNumRecords;
    // multi-day data fetch

    if (estNumberOfBatches >= 1) {
      fetchRawDataLogger.logInfo('[getDataForDateRanges] [multi-day fetch] Setting up batched requests for batches:', { estNumberOfBatches: Math.floor(estNumberOfBatches) })
      this.numberOfRecords = AW_CONSTANTS.maxNumRecordsCanGet;
      for (let i = 0; i < Math.floor(estNumberOfBatches); i++) {
        fetchRawDataLogger.logInfo('[getDataForDateRanges] [multi-day fetch] Issueing batch request:', { i: i + 1 })
        try {
          const fetchedData = await this.fetchAndStoreData(this.now, this.numberOfRecords);
          if (fetchedData) {
            const { from, to } = fetchedData;
            this.now = from;
            this.datesArray = this.datesArray.concat({ from, to });
          } else {
            this.failedDatesForDate = this.failedDatesForDate.concat(this.now);
            break;
          }
        } catch (err) {
          fetchRawDataLogger.logError('[getDataForDateRanges] [multi-day fetch] PROBLEM!', err)
        }
      }
      // fetch the last lot of data that doesn't fall into a batch
      console.log('HELLOOOOOOOOOOO')
      const lastRecordsFromDate = Math.min(...this.datesArray.map((entry) => entry.from));
      const lastRecordsLimit = Math.floor(calcMinutesDiff(lastRecordsFromDate, dateOfLastDataSaved) / AW_CONSTANTS.dataInterval)

      fetchRawDataLogger.logInfo('[getDataForDateRanges] [multi-day fetch] Setting up final collection for record count:', { lastRecordsLimit: lastRecordsLimit });

      const fetchedData = await this.fetchAndStoreData(lastRecordsFromDate, lastRecordsLimit);
      if (fetchedData) {
        const { from, to } = fetchedData;
        this.datesArray = this.datesArray.concat({ from, to })
        return { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
      } else {
        return { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
      }
    } else if (estTotalNumRecordsToFetch >= 2 && estTotalNumRecordsToFetch <= 288) {
      console.log('single day data fetch: batches is only 1, do not fetch if only one record is needed.')
      // single day data fetch, do not fetch if only one record is needed.
      try {
        fetchRawDataLogger.logInfo('[getDataForDateRanges] [single-day fetch] Fewer than a 288-batch records required. Setting up request for records count:', { estTotalNumRecordsToFetch: estTotalNumRecordsToFetch });
        const result = await this.fetchAndStoreData(this.now, estTotalNumRecordsToFetch);
        this.datesArray = this.datesArray.concat(result)

        return { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
      } catch (err) {
        fetchRawDataLogger.logError('[getDataForDateRanges] [single-day fetch] PROBLEM!', err)
      }
    } else {
      return "too early"
    }
    return { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
  };
}
module.exports = FetchRawData;
