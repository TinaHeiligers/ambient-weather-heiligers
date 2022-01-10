const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const Logger = require('./src/logger');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const FetchRawData = require('./src/dataFetchers');
const rawDataFetcher = new FetchRawData(awApi, fs);
const runFetchDataLogger = new Logger('runFetchData');
// for testing, we skip save.
const newDataDatesAndFileNames = rawDataFetcher.getDataForDateRanges(false)
  .then(res => runFetchDataLogger.logInfo('[runFetchData] [SUCCESS] return value from fetchRawDataTester.getDataForDateRanges', res) || res)
  .catch(err => runFetchDataLogger.logError('[runFetchData] [ERROR] error from fetchRawDataTester.getDataForDateRanges', err));
module.exports = newDataDatesAndFileNames;

