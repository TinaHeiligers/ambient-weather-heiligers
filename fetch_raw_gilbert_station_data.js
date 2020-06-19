const fs = require('file-system');
const momentTZ = require('moment-timezone');

const AmbientWeatherApi = require('ambient-weather-api');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

const { getLastRecordedDataDate, getLastRecordedUTCDate } = require('./helpers');
const { min } = require('moment-timezone');

// I need some sort of global saving of the date for now;

async function getDevice(save = true) {
  const devices = await awApi.userDevices();
  if (save) {
    fs.writeFile(`./data/device/${devices[0].lastData.dateutc}.json`, JSON.stringify(devices[0], null, 2));
  }
  return devices[0];
}

function padDateWithLeadingZeros(date) {
  date.setDate(date.getDate());
  return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
}

async function retryFetch(from, numRecords) {
  return await fetchRecentData(from, numRecords);
};
/*
  fetches data from ambient weather backwards in time
  @params: macAddress (string) the weather station device mac address
  @params: options (object) consisting of
    limit: number of entries to fetch data for
    endDate: date to END fetching data from
*/
async function fetchRecentData(from, numRecords) {
  const dateForFileName = from.format(`YYYYMMDD-T-hhmmss`)
  console.log('dateForFileName', dateForFileName)
  // the call takes in the endDate and counts backwards in time
  const devices = await awApi.userDevices();
  if (devices) {
    try {
      const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
      // fs.writeFile(`./data/ambient-weather-heiligers-data/${dateForFileName}.json`, JSON.stringify(allData, null, 2));
      return allData;
    } catch (err) {
      if (err.statusCode == 429) {
        console.log('Data fetching error: too many requests per second, please slow down!')
        retryFetch(from, numRecords)
      } else {
        console.log('Data fetching error')
      }
    }
  } else {
    console.log('device not found')
  }

}
//
async function getDataForDateRanges(dateForDataFetchCall = momentTZ.utc(momentTZ())) {
  let numberOfRecords;
  const datesNewDataFetchedFor = [];
  let setNow = dateForDataFetchCall; // a static point for date for dev in UTC
  const lastRecordedDataUTCDate = getLastRecordedUTCDate('ambient-weather-heiligers-data');
  // getting values needed for fetching the data
  const totalMinutesDifference = momentTZ.duration(momentTZ(setNow).diff(momentTZ(lastRecordedDataUTCDate))).as('minutes');
  const totalNumberOfRecordsToGet = Math.floor(totalMinutesDifference / 5);
  let numberOfBatches = totalNumberOfRecordsToGet / 288; // 288 5min intervals in a 24 hour period
  // while we still have an offset
  // while (totalMinutesDifference > 0) {
  numberOfRecords = numberOfBatches > 0 ? 288 : totalMinutesDifference / 5; // --> this I'll change because I'm going to decrease numberOfRecordsToGet as the data flows in
  try {
    const result = await fetchRecentData(setNow, numberOfRecords)
    // get the min date from results entries, this will be the new setNow
    const resultsDates = result.map((datum) => momentTZ.utc(momentTZ(datum.date)));
    // console.log('resultsDates', resultsDates)
    const nextBatchDateToFetchFrom = momentTZ.min(resultsDates)
    console.log('nextBatchDateToFetchFrom', nextBatchDateToFetchFrom)
    console.log('lastRecordedDataUTCDate', lastRecordedDataUTCDate)
    console.log('nextBatchDateToFetchFrom.diff(lastRecordedDataUTCDate, "min")',)
    if (result && result.length === numberOfRecords) {
      datesNewDataFetchedFor.push(setNow)
      if (nextBatchDateToFetchFrom.diff(lastRecordedDataUTCDate, "min") > 5) {
        setNow = nextBatchDateToFetchFrom;
        // similar logic used as above --> extract to a method
        numberOfRecords = Math.floor(nextBatchDateToFetchFrom.diff(lastRecordedDataUTCDate, "min") / 5)
        await fetchRecentData(nextBatchDateToFetchFrom,)
      }
      //   // call the same method again but using the new last retrieved date with
      // }
    } catch (err) {
      console.log('There was an error fetching data for date:', setNow)
    }
    return datesNewDataFetchedFor;
    // }
  }
module.exports = getDataForDateRanges();
//TODO: convert getDataForDateRanges into a Class that uses helpers
