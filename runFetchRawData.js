const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const FetchRawData = require('./src/dataFetchers');
const fetchRawDataTester = new FetchRawData(awApi, fs);
const newDataDates = fetchRawDataTester.getDataForDateRanges(true)
  .then(res => console.log('return value from fetchRawDataTester.getDataForDateRanges', res))
  .catch(err => console.log('error from fetchRawDataTester.getDataForDateRanges', err));
module.exports = newDataDates;

