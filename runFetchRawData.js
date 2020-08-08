const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const FetchRawData = require('./src/dataFetchers');
const fetchRawDataTester = new FetchRawData(awApi, fs);
const newData = fetchRawDataTester.getDataForDateRanges();

module.exports = newData;

