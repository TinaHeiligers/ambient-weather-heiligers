
const momentTZ = require('moment-timezone');
const {
  calcMinutesDiff,
  timeConstants
} = require('../utils');
const AW_CONSTANTS = {
  dataInterval: 5,
  maxNumRecords: 288,
}


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
      console.log(`clearing ${this.recentDataFileNames.length()} file names`);
      this.#recentDataFileNames = [];
    } else {
      console.log(`No filenames to clear`)
    }
  }

  extractDatesFromData = (dataArray) => {
    const dataDates = dataArray.map((datum) => momentTZ(datum.date));
    return { from: momentTZ.min(dataDates), to: momentTZ.max(dataDates) };
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
    const unqueUtcDatesArray = [...new Set(allDatesFromFiles)];
    return Math.max(...unqueUtcDatesArray);
  }

  async fetchRecentData(from, numRecords) {
    // the call takes in the endDate and counts backwards in time
    const devices = await this.AWApi.userDevices();
    if (devices && devices.length > 0) {
      try {
        return await this.AWApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
      } catch (err) {
        console.error(err)
        throw err;
      }
    } else {
      return;
    }
  }
  /**
   *
   * @param {integer} toDate date-time in milliseconds since the Unix epoch time
   * @param {integer} numRecords number of records to fetch from API (max = 288, min = 1)
   * @returns {obj} { from: date-time as milliseconds since Unix epock time, to: date-time as milliseconds since Unix epoch time}
   */
  async fetchAndStoreData(toDate, numRecords) {
    try {
      const result = await this.fetchRecentData(toDate, numRecords);
      // console.log('the result from fetching the most recent data is:', result)
      if (result && result.length > 0) {
        let actualNewDataEntries = result.filter(x => !this.allUniqueDates.includes(x.dateutc))
        // actual new data in imperial format
        console.log('allUniqueDates  before newData added:', this.allUniqueDates.length)
        const newDatesItems = [...new Set(actualNewDataEntries.map(y => y.dateutc).concat(this.allUniqueDates))]
        this.allUniqueDates = newDatesItems;
        console.log('allUniqueDatesAfternewData added:', this.allUniqueDates.length)
        // setting up to store data in files
        const { from, to } = this.extractDatesFromData(actualNewDataEntries);
        const formattedfileNameFrom = momentTZ.utc(from).format('YYYYMMDD-T-HHmm');
        const formattedfileNameTo = momentTZ.utc(to).format('YYYYMMDD-T-HHmm');
        const formattedFileName = `${formattedfileNameFrom}_${formattedfileNameTo}`;
        this.recentDataFileNames = formattedFileName
        if (!this.skipSave) {
          this.fs.writeFileSync(`data/${this.pathToFiles}/${formattedFileName}.json`, JSON.stringify(actualNewDataEntries, null, 2));
        }
        return ({ from, to });
      }
      return null;
    } catch (err) {
      console.error('error in fetchAndStoreData', err)
      throw err;
    }
  }
  // main function for this class
  async getDataForDateRanges(skipSave = false, fromDate) {
    console.log('in getDataForDateRanges')
    if (!fromDate) {
      fromDate = this.now;
    }
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
    console.log('estTotalNumRecordsToFetch', estTotalNumRecordsToFetch)
    console.log('estNumberOfBatches', estNumberOfBatches)
    // multi-day data fetch

    if (estNumberOfBatches >= 1) {
      console.log(`Setting up batched requests for ${estNumberOfBatches} batches`)
      this.numberOfRecords = AW_CONSTANTS.maxNumRecordsCanGet;
      for (let i = 0; i < Math.floor(estNumberOfBatches); i++) {
        console.log(`Issueing batch request ${i} of ${Math.floor(estNumberOfBatches)}`)
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
          console.log('PROBLEM in multi day fetch!', err)
        }
      }
      // fetch the last lot of data that doesn't fall into a batch
      const lastRecordsFromDate = momentTZ.min(this.datesArray.map((entry) => momentTZ(entry.from)));
      const lastRecordsLimit = Math.floor(calcMinutesDiff(lastRecordsFromDate, dateOfLastDataSaved) / AW_CONSTANTS.dataInterval)
      console.log(`Setting up final collection for ${lastRecordsLimit} records.`)
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
        console.log(`Fewer than a 288-batch records required. Setting up request for ${estTotalNumRecordsToFetch} records`)
        const result = await this.fetchAndStoreData(this.now, estTotalNumRecordsToFetch);
        this.datesArray = this.datesArray.concat(result)

        const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
        return finalResult;
      } catch (err) {
        console.log('PROBLEM in single day fetch!', err)
      }
    }
    console.log('this.datesArray', this.datesArray)
    const finalResult = { dataFetchForDates: this.datesArray, dataFileNames: this.recentDataFileNames };
    return finalResult;
  };
}
module.exports = FetchRawData;
