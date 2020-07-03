const AmbientWeatherApi = require('ambient-weather-api');

const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const FetchRawData = require('./FetchRawData');
const fetchRawDataTester = new FetchRawData(awApi);
const newData = fetchRawDataTester.getDataForDateRanges();

module.exports = newData;
