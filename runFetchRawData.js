const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const FetchRawData = require('./src/dataFetchers');
const rawDataFetcher = new FetchRawData(awApi, fs);
const newDataDatesAndFileNames = rawDataFetcher.getDataForDateRanges(true)
  .then(res => console.log('return value from fetchRawDataTester.getDataForDateRanges', res) && res)
  .catch(err => console.log('error from fetchRawDataTester.getDataForDateRanges', err));
module.exports = newDataDatesAndFileNames;

