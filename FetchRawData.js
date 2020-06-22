const fs = require('file-system');
const momentTZ = require('moment-timezone');
const AmbientWeatherApi = require('ambient-weather-api');
const {
  getLastRecordedUTCDate,
  calcMinutesDiff,
  extractDataInfo
} = require('./helpers');
const { relativeTimeRounding } = require('moment-timezone');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
// hard coded numbers from ambient weather API
const AW_CONSTANTS = {
  dataInterval: 5,
  maxNumRecords: 288,
}
class FetchRawData {
  #pathToFiles = 'ambient-weather-heiligers-data';
  #now = momentTZ.utc(momentTZ());
  #numberOfRecords = 0;
  #datesArray = []; // an array of objects containing a from (max date for data file entries) and to date (min date for data file entries)
  constructor() { }
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
  get now() {
    return this.#now;
  }
  set now(date) {
    this.#now = date;
  }
  get pathToFiles() {
    return this.#pathToFiles;
  }
  async retry(from, numRecords) {
    return await this.fetchRecentData(from, numRecords)
  }
  async fetchRecentData(from, numRecords) {
    // the call takes in the endDate and counts backwards in time
    const devices = await awApi.userDevices();
    if (devices) {
      try {
        const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
        return allData;
      } catch (err) {
        if (err.statusCode == 429) {
          console.log('Data fetching error: too many requests per second, please slow down!')
          this.retryFetch(from, numRecords)
        } else {
          console.log('Data fetching error')
        }
      }
    } else {
      console.log('device not found')
    }
  }
  async fetchAndStoreData(toDate, numRecords) {
    try {
      const result = await this.fetchRecentData(toDate, numRecords);
      if (result && result.length) {
        const { from, to } = extractDataInfo(result);
        fs.writeFileSync(`./data/${this.pathToFiles}/${to.format('YYYYMMDD-T-hhmm')}.json`, JSON.stringify(result, null, 2));
        return ({ from, to });
      }
    } catch (err) {
      console.log('error in fetchAndStoreData', err)
    }
  }
  async getDataForDateRanges(fromDate) {
    console.log('in getDataForDateRanges')
    if (!fromDate) {
      fromDate = this.now;
    }
    // this is all setup before I can start fetching the data
    const dateOfLastDataSaved = getLastRecordedUTCDate(this.pathToFiles);
    const minSinceLastData = calcMinutesDiff(fromDate, dateOfLastDataSaved);
    // return early if it's too soon to fetch new data
    if (minSinceLastData < AW_CONSTANTS.dataInterval) return;
    const estTotalNumRecordsToFetch = Math.floor(minSinceLastData / AW_CONSTANTS.dataInterval);
    const estNumberOfBatches = estTotalNumRecordsToFetch / AW_CONSTANTS.maxNumRecords;
    // multi-day data fetch
    if (estNumberOfBatches >= 1) {
      this.numberOfRecords = AW_CONSTANTS.maxNumRecordsCanGet;
      for (let i = 0; 1 < Math.floor(estNumberOfBatches); i++) {
        try {
          const { from, to } = await this.fetchAndStoreData(this.now, this.numberOfRecords);
          this.now = from;
          this.datesArray = this.datesArray.concat({ from, to });
        } catch (err) {
          console.log('PROBLEM in multi day fetch!', err)
        }
      }
      // fetch the last lot of data that doesn't fall into a batch
      const lastRecordsFromDate = momentTZ.min(this.datesArray.map((entry) => momentTZ(entry.from)));
      const lastRecordsLimit = Math.floor(calcMinutesDiff(lastRecordsFromDate, dateOfLastDataSaved) / AW_CONSTANTS.dataInterval)
      const { from, to } = await this.fetchAndStoreData(lastRecordsFromDate, lastRecordsLimit);
      this.datesArray = this.datesArray.concat({ from, to })
      return this.datesArray;
    } else {

      // single day data fetch
      try {
        const result = await this.fetchAndStoreData(this.now, estTotalNumRecordsToFetch);
        this.datesArray = this.datesArray.concat(result)
        return this.datesArray
      } catch (err) {
        console.log('PROBLEM in single day fetch!', err)
      }
    }
    return 'done'
  };
}
module.exports = FetchRawData;
