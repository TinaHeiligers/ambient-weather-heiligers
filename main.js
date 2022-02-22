const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const { minDateFromDateObjects } = require('./src/utils');
const { prepareDataForBulkIndexing } = require('./main_utils');
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

const toEarlyForNewData = (promiseResult) =>
  Object.keys(promiseResult) === 0 && typeof promiseResult === String && promiseResult === "too early";

const convertDataToJsonl = () => {
  imperial = imperialToJsonlConverter.convertRawImperialDataToJsonl();
  metric = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();
  return {
    imperialJSONLFileNames: imperial,
    metricJSONLFileNames: metric,
  }
}
/**
 *
 * @param {Object} stepState containing newState<string>, value<boolean
 * @param {Object} logMeta containing level: info || warn || error, message: string
 */
function updateProgressState(oldStates, stepState, logMeta) {
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
  if (!oldStates) {
    oldStates = states;
  }

  const newState = { ...oldStates, ...stepState }
  if (logMeta.warn) {
    mainLogger.logWarning(logMeta.warn)
  }
  return newState
};

async function main() {
  let datesForNewData;

  let imperialJSONLFileNames;
  let metricJSONLFileNames;
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

  // step 1: fetch new data & convert it to JSONl
  try {
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(false);
    if (toEarlyForNewData(getNewDataPromiseResult)) {
      // advance steps and log
      stepsStates = updateProgressState({ newDataSkipped: true }, { warn: 'too early' })
      // stepsStates = { ...stepsStates, newDataSkipped: true };
      // mainLogger.logWarning("too early");
    } else if (Object.keys(getNewDataPromiseResult) === ['dataFetchForDates', 'dataFileNames']) {
      datesForNewData = getNewDataPromiseResult.dataFetchForDates;
    }
    // advance steps and log
    stepsStates = { ...stepsStates, newDataFetched: true };

    mainLogger.logInfo('=============================')
    mainLogger.logInfo("converting data to metric and JSONL")

    const fileNamesFromConverter = convertDataToJsonl();
    imperialJSONLFileNames = fileNamesFromConverter.imperialJSONLFileNames
    metricJSONLFileNames = fileNamesFromConverter.metricJSONLFileNames

    mainLogger.logInfo('imperialJSONLFileNames', imperialJSONLFileNames)
    mainLogger.logInfo('metricJSONLFileNames', metricJSONLFileNames)

    stage = step[2];
    logProgress(mainLogger, stage, stepsStates)
  } catch (err) {
    mainLogger.logWarning(`==========error in step ${step[1]} or ${step[2]}==============`)
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
  if (imperialJSONLFileNames.length > 0) {
    stepsStates = { ...stepsStates, dataConvertedToJsonl: true };
    logProgress(mainLogger, stage, stepsStates)

    const datesFromFileNames = [...imperialJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedImperialDataDate) > 0) indexImperialDocsFromFiles = true // flip the switch in case we didn't get new data
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialJSONLFileNames, 'imperial');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(imperialDataReadyForBulkCall, 'imperial')
    }
  }

  // figure out what the new data is and the filenames for that, prepare it for bulk indexing and index the data
  // metric data (same code as for imperial data, only for the metric data)
  if (metricJSONLFileNames.length > 0) {
    stepsStates = { ...stepsStates, dataConvertedToJsonl: true };
    logProgress(mainLogger, stage, stepsStates)

    const datesFromFileNames = [...metricJSONLFileNames.map(name => name.split('_'))];
    const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

    if ((maxDateOnFile - lastIndexedMetricDataDate) > 0) indexMetricDocsFromFiles = true;// flip the switch in case we didn't get new data
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricJSONLFileNames, 'metric');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(metricDataReadyForBulkCall, 'metric')
    }
  }

  //read all data from the imperialJSONLFileNames array
  // scenario 3: no new data fetched
  if (imperialJSONLFileNames.length === 0) {
    stage = step[5]
    logProgress(mainLogger, stage, stepsStates)
    mainLogger.logInfo('no new files, reading exisiting imperial data from file');

    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialJSONLFileNames, 'imperial');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(imperialDataReadyForBulkCall, 'imperial')
    }
  }
  if (metricJSONLFileNames.length === 0) {
    stage = step[5]
    logProgress(mainLogger, stage, stepsStates)

    mainLogger.logInfo('no new files, reading exisiting metric data from file')
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricJSONLFileNames, 'metric');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(metricDataReadyForBulkCall, 'metric')
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
