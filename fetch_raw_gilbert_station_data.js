const fs = require('file-system');
const momentTZ = require('moment-timezone');
const AmbientWeatherApi = require('ambient-weather-api');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const currentDate = new Date();

function getDates(startDate, stopDate) {
  var dateArray = [];
  var currentDate = momentTZ(startDate);
  var stopDate = momentTZ(stopDate);
  while (currentDate <= stopDate) {
    dateArray.push(momentTZ(currentDate).format('YYYY-MM-DD HH:mm:ss'))
    currentDate = momentTZ(currentDate).add(1, 'days');
  }
  return dateArray;
}

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

async function fetchRecentData(from, numRecords) {
  const dateForFileName = padDateWithLeadingZeros(from);
  console.log('dateForFileName', dateForFileName)
  // const devices = await awApi.userDevices();
  // if (devices) {
  //   const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });
  //   fs.writeFile(`./data/ambient-weather-heiligers-data/${dateForFileName}.json`, JSON.stringify(allData, null, 2));
  //   return allData;
  // } else {
  //   console.log('device not found')
  // }
}
async function getDataForDateRanges(providedStartDate, providedEndDate) {
  const datesDataFetchedFor = [];
  const datesToGetDataFor = getDates(providedStartDate, providedEndDate);
  for (const dateForFetchingData of datesToGetDataFor) {
    const fromDate = momentTZ.utc(dateForFetchingData).toDate();
    const numberOfRecords = 288;
    try {
      const result = await fetchRecentData(fromDate, numberOfRecords);
      if (result && result.length > 0) {
        datesDataFetchedFor.push(dateForFetchingData)
      }
    } catch (err) {
      console.log('There was an error fetching data for date:', dateForFetchingData)
    }
  }
  if (datesDataFetchedFor.length === datesToGetDataFor.length) {
    console.log(`retrieved data for ${datesToGetDataFor.length} dates`)
  } else {
    console.log(`couldn't get data for ${datesToGetDataFor.length - datesDataFetchedFor.length} dates`)
  }
}
return getDataForDateRanges();
