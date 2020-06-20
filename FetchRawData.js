const fs = require('file-system');
const momentTZ = require('moment-timezone');
const AmbientWeatherApi = require('ambient-weather-api');
const { getLastRecordedUTCDate, calcMinutesDiff } = require('./helpers');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const dataInterval = 5; // hard coded because data is sent to ambient weather every 5 min and I can't cahnge that.
class FetchRawData {
  #numberOfRecords = 0;
  #maxNumRecords = 288;
  #datesArray = [];
  #now = momentTZ.utc(momentTZ());
  #newData = [];
  #pathToFiles = 'ambient-weather-heiligers-data';
  #minTimeBetweenDataFetches = 5;
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
    return this.#datesArray = newArray;
  }
  get now() {
    return this.#now;
  }
  get pathToFiles() {
    return this.#pathToFiles;
  }
  get minTimeBetweenDataFetches() {
    return this.#minTimeBetweenDataFetches;
  }
  shouldMakeCall(timeToCheck, timeToCheckAgainst) {
    return calcMinutesDiff(timeToCheck, timeToCheckAgainst) > dataInterval;
  }

  async getDataForDateRanges(fromDate) {
    if (!fromDate) {
      fromDate = this.now;
    }
    const dateOfLastDataSaved = getLastRecordedUTCDate(this.pathToFiles);
    if (!shouldMakeCall(fromDate, dateOfLastDataSaved)) return `The most recent data is ${dateOfLastDataSaved}`;

  };
  async fetchAndStoreData(now, numberOfRecords) {
    return;
  }
  async fetchRecentData(from, numRecords) {
    return;
  };
}

module.exports = FetchRawData;
