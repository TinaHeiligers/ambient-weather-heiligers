const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl } = require('./src/converters');
const Logger = require('./src/logger');

const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

async function main() {
  let dataFileNames;
  let dataFetchForDates;
  // initialize the classes;
  const mainLogger = new Logger();

  mainLogger.logInfo('starting main function', new Date());

  const fetchRawDataTester = new FetchRawData(awApi, fs);
  const imperialToJsonlConverter = new ConvertImperialToJsonl(fs);

  fetchRawDataTester.getDataForDateRanges(true)
    .then(res => {
      console.log('return value from fetchRawDataTester.getDataForDateRanges', res)
      dataFileNames = res.dataFileNames;
      dataFetchForDates = res.dataFetchForDates
    })
    .catch(err => console.log('error from fetchRawDataTester.getDataForDateRanges', err));

  if (dataFileNames && dataFileNames.length > 0) {
    const convertedData = imperialToJsonlConverter.convertRawImperialDataToJsonl();

  }


}

