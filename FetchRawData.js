const fs = require('file-system');
const momentTZ = require('moment-timezone');
const AmbientWeatherApi = require('ambient-weather-api');
const { getLastRecordedUTCDate } = require('./helpers');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

class FetchRawData {
  #numberOfRecords = 0;
  #datesArray = [];
  #now = momentTZ.utc(momentTZ());
  #newData = [];
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
  async getDataForDateRanges(fromDate) {
    if (!fromDate) {
      fromDate = this.now;
    }
    return;
  }
  async fetchAndStoreData(now, numberOfRecords) {
    return;
  }
  async fetchRecentData(from, numRecords) {
    return;
  };
}

module.exports = FetchRawData;
