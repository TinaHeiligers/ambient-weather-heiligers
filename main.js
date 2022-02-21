const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const { minDateFromDateObjects } = require('./src/utils');
const { prepareDataForBulkIndexing,
  getAllFilesFromPath } = require('./main_utils');
// initialize the classes;

const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const mainLogger = new Logger('[main]');
const fetchRawDataTester = new FetchRawData(awApi, fs);
const imperialToJsonlConverter = new ConvertImperialToJsonl(fs);
const imperialToMetricJsonlConverter = new ConvertImperialToMetric(fs);
const dataIndexer = new IndexData();

/**
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

const step = {
  0: 'error',
  1: 'fetchData',
  2: 'convertToJsonl',
  3: 'getRecentIndexedDocs',
  4: 'checkNewDataAgainstLastIndexedDoc',
  5: 'getExistingDataFromFile'
}

const states = {
  fatalError: false,
  clusterError: false,
  fetchNewData: false,
  newDataFetched: false,
  newDataSkipped: false,
  clusterReady: false,
  dataConvertedToJsonl: false,
  backfillDataFromFile: false,

}

async function main() {
  let datesForNewData;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexImperialDocsNeeded = false;
  let indexMetricDocsNeeded = false;
  let lastIndexedImperialDataDate;
  let lastIndexedMetricDataDate;
  // logging stuff
  let stage;
  let stepsStates = { ...states };

  mainLogger.logInfo('=============================')
  mainLogger.logInfo('starting main function', new Date());

  stage = step[1];
  stepsStates = { ...stepsStates, fetchNewData: true };
  logProgress(mainLogger, stage, stepsStates);

  // step 1: fetch new data if needed, otherwise, move onto step 2
  try {
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(false);
    if (Object.keys(getNewDataPromiseResult) === 0 && typeof getNewDataPromiseResult === String && getNewDataPromiseResult === "too early") {
      stepsStates = { ...stepsStates, newDataSkipped: true };
      // don't throw here, we might still need to convert already fetched data to jsonl
      mainLogger.logWarning("too early");
    } else if (Object.keys(getNewDataPromiseResult) === ['dataFetchForDates', 'dataFileNames']) {
      datesForNewData = getNewDataPromiseResult.dataFetchForDates;
    }
    stepsStates = { ...stepsStates, newDataFetched: true };
    //   mainLogger.logInfo('beginning data file conversions: json => jsonl')
    imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl(); // returns an empty array if nothing was converted
    metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl(); // returns an empty array if nothing was converted

    mainLogger.logInfo('imperialDataJSONLFileNames', imperialDataJSONLFileNames)
    mainLogger.logInfo('metricDataJSONLFileNames', metricDataJSONLFileNames)

    stage = step[2];
    logProgress(mainLogger, stage, stepsStates)
  } catch (err) {
    stage = step[0];
    stepsStates = { ...stepsStates, fatalError: true };
    logProgress(mainLogger, stage, stepsStates)
    throw err;
  }

  stage = step[3];
  logProgress(mainLogger, stage, stepsStates)
  const initializeResult = await dataIndexer.initialize(); // { lastIndexedImperialDoc, lastIndexedMetricDoc }

  if (!!initializeResult === true && initializeResult.outcome === 'success') {
    stepsStates = { ...stepsStates, clusterReady: true };
    logProgress(mainLogger, stage, stepsStates);

    lastIndexedImperialDataDate = initializeResult.latestImperialDoc[0]._source.dateutc;
    lastIndexedMetricDataDate = initializeResult.latestMetricDoc[0]._source.dateutc;
  } else {
    stepsStates = { ...stepsStates, clusterError: true };
    logProgress(mainLogger, stage, stepsStates)
  }
  // check dates for what we have now compared with what's in the cluster.
  // there are a few scenarios here:
  // 1. we fetched new data -> do indexing (checking against datesForNewData)
  // 2. we didn't fetch new data BUT we did convert old data to jsonl -> might not need indexing, so check (check agains data from files)
  // 3. we didn't fetch new data and didn't convert any data BUT what we have is newer than what's in the cluster. (check all data on file)

  // scenario 1: new data fetched
  if (datesForNewData && datesForNewData.length > 0) { //use new data}
    stage = step[4];
    logProgress(mainLogger, stage, stepsStates)

    const dateArrayNeeded = datesForNewData?.map((fromToObj => fromToObj.to))
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedImperialDataDate) > 0) indexImperialDocsNeeded = true;
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedMetricDataDate) > 0) indexMetricDocsNeeded = true;
  } // scenario 1 or 2:
  // figure out what the new data is and the filenames for that, prepare it for bulk indexing and index the data
  // imperial data
  // function prepAndBulkIndexNewData(....)
  if (imperialDataJSONLFileNames.length > 0) {
    stepsStates = { ...stepsStates, dataConvertedToJsonl: true };
    logProgress(mainLogger, stage, stepsStates)

    const datesFromFileNames = [...imperialDataJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedImperialDataDate) > 0) indexImperialDocsFromFiles = true // flip the switch in case we didn't get new data
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataJSONLFileNames, 'imperial');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(imperialDataReadyForBulkCall)
    }
  }

  // figure out what the new data is and the filenames for that, prepare it for bulk indexing and index the data
  // metric data (same code as for imperial data, only for the metric data)
  if (metricDataJSONLFileNames.length > 0) {
    stepsStates = { ...stepsStates, dataConvertedToJsonl: true };
    logProgress(mainLogger, stage, stepsStates)

    const datesFromFileNames = [...metricDataJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedMetricDataDate) > 0) indexMetricDocsFromFiles = true;// flip the switch in case we didn't get new data
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricDataJSONLFileNames, 'metric');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(metricDataReadyForBulkCall)
    }
  }

  //read all data from the imperialDataJSONLFileNames array
  // scenario 3: no new data fetched
  if (imperialDataJSONLFileNames.length === 0) {
    stage = step[5]
    logProgress(mainLogger, stage, stepsStates)
    mainLogger.logInfo('no new files, reading exisiting imperial data from file');

    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialDataJSONLFileNames, 'imperial');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(imperialDataReadyForBulkCall, 'imperial')
    }
  }
  if (metricDataJSONLFileNames.length === 0) {
    stage = step[5]
    logProgress(mainLogger, stage, stepsStates)

    mainLogger.logInfo('no new files, reading exisiting metric data from file')
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricDataJSONLFileNames, 'metric');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(metricDataReadyForBulkCall)
    }
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

module.exports = main;
