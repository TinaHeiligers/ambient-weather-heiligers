const fs = require('file-system');
const momentTZ = require('moment-timezone');

const AmbientWeatherApi = require('ambient-weather-api');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

const { getLastRecordedUTCDate } = require('./helpers');

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

  // the call takes in the endDate and counts backwards in time
  const devices = await awApi.userDevices();
  if (devices) {
    try {
      const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
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
async function fetchAndStoreData(setNow, numberOfRecords, datesArray, lastRecordedDataUTCDate) {
  const result = await fetchRecentData(setNow, numberOfRecords);

  const dateForFileName = setNow.format(`YYYYMMDD-T-hhmmss`)
  // fs.writeFileSync(`./data/ambient-weather-heiligers-data/${dateForFileName}.json`, JSON.stringify(result, null, 2));
  if (result && result.length) {
    datesArray.push(dateForFileName);

    // this is setup for next recursive call.
    const resultsDates = result.map((datum) => momentTZ.utc(momentTZ(datum.date)));
    const nextBatchDateToFetchFrom = momentTZ.min(resultsDates);
    if (nextBatchDateToFetchFrom.diff(lastRecordedDataUTCDate, "min") > 5) {
      setNow = nextBatchDateToFetchFrom;
      const totalMinutesDifference = momentTZ.duration(momentTZ(nextBatchDateToFetchFrom).diff(momentTZ(lastRecordedDataUTCDate))).as('minutes');
      const totalNumberOfRecordsToGet = Math.floor(totalMinutesDifference / 5);
      let numberOfBatches = totalNumberOfRecordsToGet / 288; // 288 5min intervals in a 24 hour period
      numberOfRecords = numberOfBatches > 0 ? 288 : totalMinutesDifference / 5;
      await fetchAndStoreData(nextBatchDateToFetchFrom, numberOfRecords, datesArray, lastRecordedDataUTCDate);
    } else {
      console.log('Fetch complete');
    }
  }
  return datesArray;
}
// TODO: figure out why my initial date isn't changing when I call this function
async function getDataForDateRanges(dateForDataFetchCall = momentTZ.utc(momentTZ())) {
  console.log('dateForDataFetchCall', dateForDataFetchCall)
  let numberOfRecords;
  let datesArray;
  let setNow = dateForDataFetchCall; // a static point for date for dev in UTC
  const lastRecordedDataUTCDate = getLastRecordedUTCDate('ambient-weather-heiligers-data');
  const totalMinutesDifference = momentTZ.duration(momentTZ(setNow).diff(momentTZ(lastRecordedDataUTCDate))).as('minutes');
  // my static point isn't actually being reset
  console.log('totalMinutesDifference', totalMinutesDifference)
  if (totalMinutesDifference < 5) return "It hasn't been long enough to fetch data";
  const totalNumberOfRecordsToGet = Math.floor(totalMinutesDifference / 5);
  let numberOfBatches = totalNumberOfRecordsToGet / 288; // 288 5min intervals in a 24 hour period
  numberOfRecords = numberOfBatches > 0 ? 288 : totalMinutesDifference / 5;
  try {
    datesArray = await fetchAndStoreData(setNow, numberOfRecords, [], lastRecordedDataUTCDate)
  } catch (err) {
    console.log('There was an error fetching data for date:', err)
  }
  console.log('datesArray', datesArray)
  return datesArray;
}
module.exports = getDataForDateRanges();
//TODO: convert getDataForDateRanges into a Class that uses helpers
