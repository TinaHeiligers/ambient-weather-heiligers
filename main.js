const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const momentTZ = require('moment-timezone')

// initialize the classes;

const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const mainLogger = new Logger('main');
const fetchRawDataTester = new FetchRawData(awApi, fs);
const imperialToJsonlConverter = new ConvertImperialToJsonl(fs);
const imperialToMetricJsonlConverter = new ConvertImperialToMetric(fs);
const dataIndexer = new IndexData();

/**
 *
 * @param {array} values returned from getNewDataPromise and getRecentIndexedDataDates
 * @returns boolean: true if last indexed data for imperial and metric data is the same and that date is older than the date from which new data was fetched.
 */
// function lastIndexedIsOlderThanNewData(values) {
//   const newDataInUTC = momentTZ.utc(values[0].from);
//   if (values[1].lastIndexedImperialDataDate === values[1].lastIndexedMetricDataDate) {
//     return newDataInUTC > momentTZ(values[1].lastIndexedImperialDataDate)
//   }
// }

async function main() {
  let datesForNewData;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexDocsNeeded = false;
  mainLogger.logInfo('starting main function', new Date());

  try {
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(false);
    datesForNewData = getNewDataPromiseResult.dataFetchForDates;
  } catch (err) {
    throw new Error('no return from fetchRawDataTester.getDataForDateRanges(false)', err)
  }


  const { lastIndexedImperialDataDate,
    lastIndexedMetricDataDate } = await dataIndexer.initialize();

  mainLogger.logInfo('datesForNewData', datesForNewData) // now get the minimum of all these dates and check agains the last indexed data dates

  mainLogger.logInfo('lastIndexedImperialDataDate', lastIndexedImperialDataDate)
  mainLogger.logInfo('lastIndexedMetricDataDate', lastIndexedMetricDataDate)


  //   mainLogger.logInfo('beginning new data file conversion: json => jsonl')
  //   imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl()
  //   metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();
  //   mainLogger.logInfo('imperialDataJSONLFileNames', imperialDataJSONLFileNames)
  //   mainLogger.logInfo('metricDataJSONLFileNames', metricDataJSONLFileNames)
  //   return { newImperialFiles: imperialDataJSONLFileNames, newMetricFiles: metricDataJSONLFileNames }
  //   // now read the data in all the new files and compare the data date with that in the index. If the late is newer (more recent)
  //   // than the date in the index, add the datapoint to what needs to be formatted for bulk indexing.
};

// the following workflow is to index new data as we get it. What this doesn't do is index data that we have on file but that isn't yet in the cluster indices.
// convert and prepare for the bulk indexing call.
// if (dataFileNames && dataFileNames.length > 0 && indexDocsNeeded) {
// main()
module.exports = (async () => {
  try {
    var result = await main();
    console.log(result);
  } catch (err) {
    throw err;
  }
})()
