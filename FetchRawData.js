
const momentTZ = require('moment-timezone');
const {
  calcMinutesDiff
} = require('./helpers');

const AW_CONSTANTS = {
  dataInterval: 5,
  maxNumRecords: 288,
}

class FetchRawData {
  #pathToFiles = 'ambient-weather-heiligers-imperial';
  #now = momentTZ.utc(momentTZ());
  #numberOfRecords = 0;
  #datesArray = [];
  #failedDatesForDataFetch = [];
  constructor(awApi, fs, path) {
    this.AWApi = awApi;
    this.fs = fs;
    this.path = path;
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

  extractDataInfo = (dataArray) => {
    const dataDates = dataArray.map((datum) => momentTZ(datum.date));
    const dataFrom = momentTZ.min(dataDates);
    const dataTo = momentTZ.max(dataDates);
    return { from: dataFrom, to: dataTo };
  };
  //generic mostRecentDate getter from existing data files
  getLastRecordedUTCDate = (pathToFolder) => {
    const directoryPath = this.path.join(__dirname, `data/${pathToFolder}`);
    const files = this.fs.readdirSync(directoryPath);
    const maxFileEntriesDatesArray = files.map((file) => {
      // get the max date from ONE file
      const data = JSON.parse(this.fs.readFileSync(`data/${pathToFolder}/${file}`)); // is an array of objects
      dataDates = data.map((datum) => momentTZ(datum.date));
      return momentTZ.max(dataDates);
    });
    const mostRecentDate = momentTZ.max(maxFileEntriesDatesArray);
    return momentTZ.utc(mostRecentDate);
  };

  async fetchRecentData(from, numRecords) {
    // the call takes in the endDate and counts backwards in time
    const devices = await this.AWApi.userDevices();
    if (devices && devices.length > 0) {
      try {
        return await this.AWApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
      } catch (err) {
        throw err;
      }
    } else {
      return;
    }
  }

  async fetchAndStoreData(toDate, numRecords) {
    try {
      const result = await this.fetchRecentData(toDate, numRecords);
      if (result && result.length > 0) {
        const { from, to } = this.extractDataInfo(result);
        this.fs.writeFileSync(`./data/${this.pathToFiles}/${to.format('YYYYMMDD-T-hhmm')}.json`, JSON.stringify(result, null, 2));
        return ({ from, to });
      }
      return null;
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
    const dateOfLastDataSaved = this.getLastRecordedUTCDate(this.pathToFiles);
    const minSinceLastData = calcMinutesDiff(fromDate, dateOfLastDataSaved);
    // return early if it's too soon to fetch new data
    if (minSinceLastData < AW_CONSTANTS.dataInterval) return;
    const estTotalNumRecordsToFetch = Math.floor(minSinceLastData / AW_CONSTANTS.dataInterval);
    const estNumberOfBatches = estTotalNumRecordsToFetch / AW_CONSTANTS.maxNumRecords;
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
        return this.datesArray;
      } else {
        return this.datesArray;
      }
    } else {

      // single day data fetch
      try {
        console.log(`Fewer than a 288-batch records required. Setting up request for ${estTotalNumRecordsToFetch} records`)
        const result = await this.fetchAndStoreData(this.now, estTotalNumRecordsToFetch);
        this.datesArray = this.datesArray.concat(result)
        return this.datesArray
      } catch (err) {
        console.log('PROBLEM in single day fetch!', err)
      }
    }
    return this.datesArray;
  };
}
module.exports = FetchRawData;
