const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const { minDateFromDateObjectsArray } = require('./src/utils');

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
/**
 *
 * @param {*} objArray
 * @example
 const datesForNewData = getNewDataPromiseResult.dataFetchForDates;
 geoupBy(etNewDataPromiseResult.dataFetchForDates) = [
  Moment<2022-01-07T14:05:00-07:00>,
  Moment<2022-01-08T14:00:00-07:00>,
  Moment<2022-01-06T14:10:00-07:00>,
  Moment<2022-01-07T14:00:00-07:00>,
  Moment<2022-01-05T14:15:00-07:00>,
  Moment<2022-01-06T14:05:00-07:00>,
  Moment<2022-01-04T14:20:00-07:00>,
  Moment<2022-01-05T14:10:00-07:00>,
  Moment<2022-01-03T14:25:00-07:00>,
  Moment<2022-01-04T14:15:00-07:00>,
  Moment<2022-01-02T14:20:00-07:00>,
  Moment<2022-01-03T14:20:00-07:00>,
  Moment<2022-01-01T14:25:00-07:00>,
  Moment<2022-01-02T14:15:00-07:00>,
  Moment<2021-12-31T14:30:00-07:00>,
  Moment<2022-01-01T14:20:00-07:00>,
  Moment<2021-12-31T12:00:00-07:00>,
  Moment<2021-12-31T14:25:00-07:00>
]
 */


async function main() {
  let datesForNewData;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexImperialDocsNeeded = false;
  let indexMetricDocsNeeded = false;
  mainLogger.logInfo('starting main function', new Date());

  try {
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(true);
    if (getNewDataPromiseResult === "too early") {
      // throw new Error(getNewDataPromiseResult)
      console.log('too early')
    }
    datesForNewData = getNewDataPromiseResult.dataFetchForDates;
  } catch (err) {
    throw err;
  }

  const { lastIndexedImperialDataDate,
    lastIndexedMetricDataDate } = await dataIndexer.initialize();

  // check if new data needs to be indexed based on the dates of the new data that's fetched vs date of most recently indexed documents
  if (minDateFromDateObjectsArray(datesForNewData).isAfter(lastIndexedImperialDataDate)) {
    indexImperialDocsNeeded = true;
    mainLogger.logInfo('indexImperialDocsNeeded', indexImperialDocsNeeded)
  }
  if (minDateFromDateObjectsArray(datesForNewData).isAfter(lastIndexedMetricDataDate)) {
    indexMetricDocsNeeded = true;
    mainLogger.logInfo('indexMetricDocsNeeded', indexMetricDocsNeeded)
  }

  //   mainLogger.logInfo('beginning new data file conversion: json => jsonl')
  imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl()
  metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();
  mainLogger.logInfo('imperialDataJSONLFileNames', imperialDataJSONLFileNames)
  mainLogger.logInfo('metricDataJSONLFileNames', metricDataJSONLFileNames)
  // now read the data in all the new files and compare the data date with that in the index. If the late is newer (more recent)
  // than the date in the index, add the datapoint to what needs to be formatted for bulk indexing.

  // The following workflow is to index new data as we get it. What this doesn't do is index data that we have on file but that isn't yet in the cluster indices.
  // convert and prepare for the bulk indexing call.
  if (indexImperialDocsNeeded === true) {
    //read all data from the imperialDataJSONLFileNames array
    // this is a prepareDataForBulkIndex method
    const dataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataFileNames, 'imperial');
    console.log('dataReadyForBulkCall', dataReadyForBulkCall)

  }
};

function prepareDataForBulkIndex(fileNamesArray, dataType) {
  let preparedData = [];
  const fullPathToFilesToRead = `/data/ambient-weather-heiligers-${dataType}-jsonl`;
  const fullFilePaths = fileNamesArray.map(filename => `${fullPathToFilesToRead}/${filename}`);
  return fullFilePaths.map(fullPath => {
    if (Object.keys(fullPath).length === 0) return true;
    const readJsonlData = JSON.parse(fs.readFileSync(fullPath));
    const dataWithIndexAdded = readJsonlData.flatMap(doc => [{ index: { _index: `ambient_weather_heiligers_${dataType}*` } }, doc]);
    console.log('dataWithIndexAdded', dataWithIndexAdded)
    preparedData.push(dataWithIndexAdded);
    console.log('preparedData', preparedData)
    return preparedData;
    // read the data and add the extra stuff we need for bulkIndexing.
    // convert it to the shape we expect to pass into bulkIndex,
    // example doc is:
    // {"date":"2022-01-09T00:55:00.000Z","dateutc":1641689700000,"loc":"ambient-prod-1","last_rain":"2022-01-01T10:43:00.000Z","uv":0,"wind_dir":320,"humidity":56,"humidity_inside":39,"barometer_abs_bar":9718.259152,"barometer_rel_bar":10194.385446,"temp_inside_c":21.778,"temp_outside_c":14.5,"battery_condition":"good","windspeed_km_per_hr":0,"windgust_km_per_hr":0,"max_daily_gust_km_per_hr":11.104,"hourly_rain_mm":0,"event_rain_mm":0,"daily_rain_mm":0,"weekly_rain_mm":0,"monthly_rain_mm":10,"total_rain_mm":305,"solar_radiation_W_per_sq_m":0,"feels_like_outside_c":14.5,"dewpoint_c":5.828,"feelslike_inside_c":21.056,"dewpoint_inside_c":7.222}
  });

}

module.exports = (async () => {
  try {
    var result = await main();
    console.log(result);
  } catch (err) {
    // I'll want to log these results rather than throw.
    throw err;
  }
})()
