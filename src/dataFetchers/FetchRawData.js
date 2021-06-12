
const momentTZ = require('moment-timezone');
const {
  calcMinutesDiff
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
  #now = momentTZ.utc(momentTZ());
  #numberOfRecords = 0;
  #datesArray = [];
  #allUniqueDates = [];
  #failedDatesForDataFetch = [];
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

  extractDataInfo = (dataArray) => {
    const dataDates = dataArray.map((datum) => momentTZ(datum.date));
    const dataFrom = momentTZ.min(dataDates);
    const dataTo = momentTZ.max(dataDates);
    return { from: dataFrom, to: dataTo };
  };

  addDateEntries(dateArray) {
    let uniqueDates = [... new Set(dateArray)];
    this.allUniqueDates = uniqueDates;
  };

  //generic mostRecentDate getter from existing data files
  getLastRecordedUTCDate = (pathToFolder) => {
    const allFilesDatesArray = [];
    const directoryPath = `data/${pathToFolder}`;
    const files = this.fs.readdirSync(directoryPath);
    if (files && files.length > 0) {
      const maxFileEntriesDatesArray = files.map((file) => {
        console.log('the file is: ', file)
        // get the max date from ONE file
        if (file === '.DS_Store') {
          return
        } else {
          const data = JSON.parse(this.fs.readFileSync(`data/${pathToFolder}/${file}`)); // is an array of objects
          // add the dates to the unique date entries TODO: this is being overwritten for each file :facepalm!!!!!
          data.forEach(datum => allFilesDatesArray.push(datum.date));
          const result = momentTZ.max(data.map((datum) => momentTZ(datum.date)));
          return result
        }
      });
      const mostRecentDate = momentTZ.max(maxFileEntriesDatesArray);
      return { mostRecentDate: momentTZ.utc(mostRecentDate), allFilesDates: [...new Set(allFilesDatesArray)] };
    }
    return { mostRecentDate: momentTZ.utc(momentTZ(this.now).subtract(1, 'days')), allFilesDates: [... new Set(allFilesDatesArray)] };
  };

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

  async fetchAndStoreData(toDate, numRecords) {
    console.log('toDate:', toDate)
    try {
      const result = await this.fetchRecentData(toDate, numRecords);
      if (result && result.length > 0) {
        let actualNewDataEntries = result.filter(x => !this.allUniqueDates.includes(x.date))
        const newDatesItems = [...new Set(actualNewDataEntries.map(y => y.date).concat(this.allUniqueDates))]
        this.allUniqueDates = newDatesItems;
        const { from, to } = this.extractDataInfo(actualNewDataEntries);
        const formattedfileNameFrom = momentTZ.utc(from).format('YYYYMMDD-T-HHmm');
        const formattedfileNameTo = momentTZ.utc(to).format('YYYYMMDD-T-HHmm');
        const formattedFileName = `${formattedfileNameFrom}_${formattedfileNameTo}`
        this.fs.writeFileSync(`data/${this.pathToFiles}/${formattedFileName}.json`, JSON.stringify(actualNewDataEntries, null, 2));
        return ({ from, to });
      }
      return null;
    } catch (err) {
      console.error('error in fetchAndStoreData', err)
      throw err
    }
  }
  async getDataForDateRanges(fromDate) {
    console.log('in getDataForDateRanges')
    if (!fromDate) {
      fromDate = this.now;
    }
    // this is all setup before I can start fetching the data
    const results = this.getLastRecordedUTCDate(this.pathToFiles);

    const dateOfLastDataSaved = results.mostRecentDate;
    const allFilesDates = results.allFilesDates
    // set the unique dates entry set to the class instance
    this.allUniqueDates = allFilesDates;
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
