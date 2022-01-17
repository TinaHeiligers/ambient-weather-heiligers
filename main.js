const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const { minDateFromDateObjects } = require('./src/utils');

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

/**
 *
 * @param {class} logger : mainLogger instance
 * @param {*} stage : stage to advance the step
 * @param {*} stepsStates : current state within progress flow
 * @returns {void}: logs to console
 */
const logProgress = (logger = mainLogger, stage, stepsStates) => {
  logger.logInfo('STAGE:', stage);
  console.log();
  logger.logInfo('stepsStates:', stepsStates);
  console.log();
}

async function main() {
  let datesForNewData;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexImperialDocsNeeded = false;
  let indexMetricDocsNeeded = false;
  let indexImperialDocsFromFiles = false;
  let indexMetricDocsFromFiles = false;
  let lastIndexedImperialDataDate;
  let lastIndexedMetricDataDate;

  let stage;
  let step = {
    0: 'error',
    1: 'fetchData',
    2: 'convertToJsonl',
    3: 'getRecentIndexedDocs',
    4: 'checkNewDataAgainstLastIndexedDoc',
    5: 'getExistingDataFromFile'
  }
  const stepsStates = {
    fatalError: false,
    fetchNewData: false,
    newDataFetched: false,
    newDataSkipped: false,
    clusterReady: false,
    dataConvertedToJsonl: false,
    backfillDataFromFile: false,

  }
  mainLogger.logInfo('starting main function', new Date());

  stage = step[1];
  stepsStates.fetchNewData = true;
  logProgress(mainLogger, stage, stepsStates);

  // step 1: fetch new data if needed, otherwise, move onto step 2
  try {
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(true);
    if (getNewDataPromiseResult === "too early") {
      stepsStates.newDataSkipped = true;
      // don't throw here, we might still need to convert already fetched data to jsonl
      mainLogger.logWarning(getNewDataPromiseResult)
    }
    datesForNewData = getNewDataPromiseResult.dataFetchForDates;

    stepsStates.fetchNewData = false;
    stepsStates.newDataFetched = true;

    //   mainLogger.logInfo('beginning data file conversions: json => jsonl')
    imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl(); // returns an empty array if nothing was converted
    metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl(); // returns an empty array if nothing was converted

    mainLogger.logInfo('imperialDataJSONLFileNames', imperialDataJSONLFileNames)
    mainLogger.logInfo('metricDataJSONLFileNames', metricDataJSONLFileNames)

    stage = step[2];
    logProgress(mainLogger, stage, stepsStates)
  } catch (err) {
    stage = step[0];
    stepsStates.fatalError = true;
    logProgress(mainLogger, stage, stepsStates)
    throw err;
  }
  stage = step[3];
  logProgress(mainLogger, stage, stepsStates)

  // this can happen regardless? yes
  const initializeResult = await dataIndexer.initialize(); // { lastIndexedImperialDoc, lastIndexedMetricDoc }
  if (!!initializeResult === true && Object.keys(initializeResult).includes('latestImperialDoc', 'latestMetricDoc')) {
    stepsStates.clusterReady = true;
    logProgress(mainLogger, stage, stepsStates)
    lastIndexedImperialDataDate = initializeResult.latestImperialDoc[0]._source.dateutc;
    lastIndexedMetricDataDate = initializeResult.latestMetricDoc[0]._source.dateutc;
  }
  // check dates for what we have now compared with what's in the cluster.
  // there are a few scenarios here:
  // 1. we fetched new data -> do indexing (checking against datesForNewData)
  // 2. we didn't fetch new data BUT we did convert old data to jsonl -> might not need indexing, so check (check agains data from files)
  // 3. we didn't fetch new data and didn't convert any data BUT what we have is newer than what's in the cluster. (check all data on file)

  // OR MAKE LIFE EASY AND JUST READ FROM FILE, REGARDLESS

  // scenario 1: new data fetched
  if (datesForNewData && datesForNewData.length > 0) { //use new data}
    stage = step[4];
    logProgress(mainLogger, stage, stepsStates)
    const dateArrayNeeded = datesForNewData?.map((fromToObj => fromToObj.to))
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedImperialDataDate) > 0) indexImperialDocsNeeded = true;
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedMetricDataDate) > 0) indexMetricDocsNeeded = true;
  } // scenario 1 or 2:
  if (imperialDataJSONLFileNames.length > 0) {
    stepsStates.dataConvertedToJsonl = true;
    logProgress(mainLogger, stage, stepsStates)
    const datesFromFileNames = [...imperialDataJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedImperialDataDate) > 0) indexImperialDocsFromFiles = true // flip the switch in case we didn't get new data
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataJSONLFileNames, 'imperial');
  }
  if (metricDataJSONLFileNames.length > 0) {
    stepsStates.dataConvertedToJsonl = true;
    logProgress(mainLogger, stage, stepsStates)
    const datesFromFileNames = [...metricDataJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedMetricDataDate) > 0) indexMetricDocsFromFiles = true;// flip the switch in case we didn't get new data
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricDataJSONLFileNames, 'metric');
  }
  // now read the data in all the new files and compare the data date with that in the index. If the late is newer (more recent)
  // than the date in the index, add the datapoint to what needs to be formatted for bulk indexing.

  //read all data from the imperialDataJSONLFileNames array
  // this is a prepareDataForBulkIndex method

  if (imperialDataJSONLFileNames.length === 0) {
    stage = step[5]
    logProgress(mainLogger, stage, stepsStates)
    mainLogger.logInfo('no new files, reading exisiting imperial data from file')
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataJSONLFileNames, 'imperial');
    // console.log('imperialDataReadyForBulkCall', imperialDataReadyForBulkCall)
    // console.log();
  }
  if (metricDataJSONLFileNames.length === 0) {
    stage = step[5]
    // mainLogger.logInfo('no new files, reading exisiting imperial data from file')
    // console.log();
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataJSONLFileNames, 'metric');
    // console.log('imperialDataReadyForBulkCall', imperialDataReadyForBulkCall)
    // console.log();
  }
  if (!stepsStates.fatalError === true) {
    return 'DONE'
  } else {
    mainLogger.logError(stepsStates)
    console.log()
    mainLogger.logError(stage)
    console.log()
  }
};

function prepareDataForBulkIndexing(fileNamesArray, dataType) {
  mainLogger.logInfo('[prepareDataForBulkIndexing] [fileNamesArray]:', fileNamesArray)
  mainLogger.logInfo('[prepareDataForBulkIndexing] [dataType]:', dataType)
  let preparedData = [];
  // fetch and read the data first
  const fullPathToFilesToRead = `data/ambient-weather-heiligers-${dataType}-jsonl`; // can be moved to the top.
  if (fileNamesArray.length === 0) {
    console.log('fileNamesArray is empty')
    fileNamesArray = readAllData(fullPathToFilesToRead); // get everything
  }
  console.log('fileNamesArray:', fileNamesArray);
  const fullFilePaths = fileNamesArray.map(filename => `${fullPathToFilesToRead}/${filename}.jsonl`);
  return fullFilePaths.map(fullPath => {
    if (Object.keys(fullPath).length === 0) return true;
    const readJsonlData = JSON.parse(fs.readFileSync(fullPath));

    const dataWithIndexAdded = readJsonlData.flatMap(doc => [{ index: { _index: `ambient_weather_heiligers_${dataType}*` } }, doc]);
    console.log('!!!!!!!!!!!!!!!dataWithIndexAdded', dataWithIndexAdded)
    preparedData.push(dataWithIndexAdded);
    console.log('???????????????preparedData', preparedData)
    return preparedData;
    // read the data and add the extra stuff we need for bulkIndexing.
    // convert it to the shape we expect to pass into bulkIndex,
    // example doc is:
    // {"date":"2022-01-09T00:55:00.000Z","dateutc":1641689700000,"loc":"ambient-prod-1","last_rain":"2022-01-01T10:43:00.000Z","uv":0,"wind_dir":320,"humidity":56,"humidity_inside":39,"barometer_abs_bar":9718.259152,"barometer_rel_bar":10194.385446,"temp_inside_c":21.778,"temp_outside_c":14.5,"battery_condition":"good","windspeed_km_per_hr":0,"windgust_km_per_hr":0,"max_daily_gust_km_per_hr":11.104,"hourly_rain_mm":0,"event_rain_mm":0,"daily_rain_mm":0,"weekly_rain_mm":0,"monthly_rain_mm":10,"total_rain_mm":305,"solar_radiation_W_per_sq_m":0,"feels_like_outside_c":14.5,"dewpoint_c":5.828,"feelslike_inside_c":21.056,"dewpoint_inside_c":7.222}
  });
}

function readAllData(fullPathToFiles) {
  console.log('in readAllData with fullPathToFiles as:', fullPathToFiles)
  const files = fs.readdirSync(fullPathToFiles);
  let filesArray = [];// an array of filenames without the extension type: string[] | []
  filesArray = files.map((file) => (`${file}`.split(".")[0])).filter((fileName => fileName.length > 0));
  console.log('finished reading the dir, with a result of filesArray:', filesArray);
  return filesArray;
}

module.exports = main;
