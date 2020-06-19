const fs = require('file-system');
const momentTZ = require('moment-timezone');

const AmbientWeatherApi = require('ambient-weather-api');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

const { getLastRecordedDataDate, getDates } = require('./helpers');

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

/*
  fetches data from ambient weather backwards in time
  @params: macAddress (string) the weather station device mac address
  @params: options (object) consisting of
    limit: number of entries to fetch data for
    endDate: date to END fetching data from
*/
async function fetchRecentData(from, numRecords) {
  const dateForFileName = from.format(`YYYY-MM-DDThh_mm_ss`)
  console.log('dateForFileName', dateForFileName)
  // the call takes in the endDate and counts backwards in time
  const devices = await awApi.userDevices();
  if (devices) {
    const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
    fs.writeFile(`./data/ambient-weather-heiligers-data/${dateForFileName}.json`, JSON.stringify(allData, null, 2));
    return allData;
  } else {
    console.log('device not found')
  }
  return null;
}

async function getDataForDateRanges() {
  const datesNewDataFetchedFor = [];
  let setNow = momentTZ(); // a static point for date for dev
  // placeholders for changing items after fetching some data
  let dateOfLastRecordedData;
  let currentDateDiff;
  let numberOfRecords;
  // I need to determine what data is missing from what I already have -> this can all be extracted into a helper fnc
  // determine the diff bwt mostRecentDataDate and now and divide that by 5 min to see the num of data entries to retrieve.
  const LastRecordedData = getLastRecordedDataDate('ambient-weather-heiligers-data');
  const totalMinutesDifference = momentTZ.duration(momentTZ(setNow).diff(momentTZ(LastRecordedData))).as('minutes');
  const totalNumberOfRecordsToGet = Math.floor(totalMinutesDifference / 5);
  let numberOfBatches = totalNumberOfRecordsToGet / 288; // 288 5min intervals in a 24 hour period
  // we can loop with 288 records if the batch count is an integer
  // OR we loop while the total min diff is neg

  // while ("we still need to fetch data") {
  // set the initial values if we've only started fetching data
  if (!dateOfLastRecordedData && !currentDateDiff) {
    dateOfLastRecordedData = LastRecordedData;
    currentDateDiff = totalMinutesDifference;
  }
  numberOfRecords = numberOfBatches > 0 ? 288 : numberOfBatches * 288; // --> this I'll change because I'm going to decrease numberOfRecordsToGet as the data flows in
  try {
    const result = await fetchRecentData(setNow, numberOfRecords)

    if (result && result.length === numberOfRecords) {
      datesNewDataFetchedFor.push(dateOfLastRecordedData)
      // call the same method again but using the new last retrieved date with
    }
  } catch (err) {
    console.log('There was an error fetching data for date:', dateToFetchDataFrom)
  }
  return datesNewDataFetchedFor;

  // }
  // fetch data
  // try {
  //   const result = await fetchRecentData(dateToFetchDataFrom, numberOfRecords);
  //   if (result && result.length > 0) {
  //     datesNewDataFetchedFor.push(dateForFetchingData)
  //   }
  // } catch (err) {
  //   console.log('There was an error fetching data for date:', dateForFetchingData)
  // }
  // }
  // what I can do now is fetch a batch and repeat the whole process again OR keep in mem the most recent date from the data fetched


  // const datesToGetDataFor = getDates(dateArrayForAlreadyRetrievedData);

  // for (const dateForFetchingData of datesToGetDataFor) {
  //   const fromDate = momentTZ.utc(dateForFetchingData).toDate();
  //   const numberOfRecords = 288; // figure out this numner based on the diff between the previous time and the given time
  //   try {
  //     const result = await fetchRecentData(fromDate, numberOfRecords);
  //     if (result && result.length > 0) {
  //       datesNewDataFetchedFor.push(dateForFetchingData)
  //     }
  //   } catch (err) {
  //     console.log('There was an error fetching data for date:', dateForFetchingData)
  //   }
  // }
  // if (datesNewDataFetchedFor.length === datesToGetDataFor.length) {
  //   console.log(`retrieved data for ${datesToGetDataFor.length} dates`)
  // } else {
  //   console.log(`couldn't get data for ${datesToGetDataFor.length - datesNewDataFetchedFor.length} dates`)
  // }
}
module.exports = getDataForDateRanges();
//TODO: convert getDataForDateRanges into a Class that uses helpers
