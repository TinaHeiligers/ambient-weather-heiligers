const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');
const { minDateFromDateObjects } = require('./src/utils');
const { prepareDataForBulkIndexing, updateProgressState } = require('./main_utils');
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
  logger.logInfo('[STAGE]:', stage + `\n`);
  logger.logInfo('[STEPS STATE]:', stepsStates);
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
 * @param {string} dataType: imperial | metric
 * @param {string[]} dataFileNames: file names of the files containing new data that has to be indexed
 * @param {Object} stepsStates: state of progress through algorithm
 * @param {string} stage: current algorithm stage
 * @param {Logger} mainLogger
 * @param {boolean} indexDocsNeeded: does data need to be indexed
 */
async function prepAndBulkIndexNewData(dataType, dataFileNames, stepsStates, lastIndexedDataDate, indexDocsNeeded) {
  const datesFromFileNames = [...dataFileNames.map(name => name.split('_'))];
  const maxDateOnFile = Math.max(...datesFromFileNames.map((entry => entry * 1))); // will return NaN for non-integer entries

  if ((maxDateOnFile - lastIndexedDataDate) > 0) indexDocsNeeded = true // flip the switch in case we didn't get new data
  const dataReadyForBulkCall = prepareDataForBulkIndexing(dataFileNames, dataType);
  if (!stepsStates.clusterError) {
    await dataIndexer.bulkIndexDocuments(dataReadyForBulkCall, dataType)
  }
}

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

  stage = step[1];
  stepsStates = updateProgressState({ fetchNewData: true }, { info: `starting main function at ${new Date()}` }, mainLogger)
  logProgress(mainLogger, stage, stepsStates);

  // step 1: fetch new data & convert it to JSONl
  try {
    // const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(false);
    const getNewDataPromiseResult = await fetchRawDataTester.getDataForDateRanges(true);
    if (toEarlyForNewData(getNewDataPromiseResult)) {
      // advance steps and log
      stepsStates = updateProgressState({ newDataSkipped: true }, { warn: 'too early' }, mainLogger, { ...stepsStates })
    } else if (Object.keys(getNewDataPromiseResult).includes('dataFetchForDates') && Object.keys(getNewDataPromiseResult).includes('dataFileNames')) {
      datesForNewData = getNewDataPromiseResult.dataFetchForDates;
    }

    stepsStates = updateProgressState({ newDataFetched: true }, { info: `converting data to metric and JSONL` }, mainLogger, { ...stepsStates })
    const fileNamesFromConverter = convertDataToJsonl();
    imperialJSONLFileNames = fileNamesFromConverter.imperialJSONLFileNames
    metricJSONLFileNames = fileNamesFromConverter.metricJSONLFileNames

    stepsStates = updateProgressState({ dataConvertedToJsonl: true }, { info: `imperialJSONLFileNames ${imperialJSONLFileNames}\n metricJSONLFileNames ${metricJSONLFileNames}` }, mainLogger, { ...stepsStates })
    logProgress(mainLogger, stage, stepsStates)
  } catch (err) {

    stage = step[0];
    stepsStates = updateProgressState({ fatalError: true }, { error: `error in step ${step[1]} or ${step[2]}`, errorInfo: err }, mainLogger, { ...stepsStates })
    logProgress(mainLogger, stage, stepsStates)
    throw err;
  }

  stage = step[3];
  logProgress(mainLogger, stage, stepsStates)
  const initializeResult = await dataIndexer.initialize();

  if (!!initializeResult === true && initializeResult.outcome === 'success') {
    stepsStates = updateProgressState({ clusterReady: true }, { info: `indexer cluster ping response ${initializeResult.outcome}` }, mainLogger, { ...stepsStates })

    logProgress(mainLogger, stage, stepsStates);

    lastIndexedImperialDataDate = initializeResult.latestImperialDoc[0]._source.dateutc;
    lastIndexedMetricDataDate = initializeResult.latestMetricDoc[0]._source.dateutc;
  } else {

    stepsStates = updateProgressState({ clusterError: true }, { error: `indexer could not initalize: ${initializeResult.outcome}` }, mainLogger, { ...stepsStates });
    logProgress(mainLogger, stage, stepsStates)
  }

  // scenario 1: new data fetched
  if (datesForNewData && datesForNewData.length > 0) { //use new data
    stage = step[4];
    logProgress(mainLogger, stage, stepsStates)

    const dateArrayNeeded = datesForNewData?.map((fromToObj => fromToObj.to))
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedImperialDataDate) > 0) indexImperialDocsNeeded = true;
    if ((minDateFromDateObjects(dateArrayNeeded) - lastIndexedMetricDataDate) > 0) indexMetricDocsNeeded = true;

  }

  // scenario 1 or 2:
  if (imperialJSONLFileNames.length > 0) {
    stepsStates = updateProgressState({ dataConvertedToJsonl: true }, { info: `preparing imperial data for bulk index ` }, mainLogger, { ...stepsStates })
    logProgress(mainLogger, stage, stepsStates)
    prepAndBulkIndexNewData('imperial', imperialJSONLFileNames, lastIndexedImperialDataDate, { indexImperialDocsNeeded: true })

  }

  if (metricJSONLFileNames.length > 0) {
    stepsStates = updateProgressState({ dataConvertedToJsonl: true }, { info: `preparing metric data for bulk index ` }, mainLogger, { ...stepsStates })
    logProgress(mainLogger, stage, stepsStates)

    prepAndBulkIndexNewData('metric', metricJSONLFileNames, lastIndexedMetricDataDate, { indexMetricDocsNeeded: true })
    console.log('7. HELLO!!!!!!!!!!!!!!!!!!')
  }

  // scenario 3: no new data fetched
  if (imperialJSONLFileNames.length === 0) {
    stage = step[5]
    stepsStates = updateProgressState({ backfillDataFromFile: true }, { info: `no new files, reading exisiting imperial data from file` }, mainLogger, { ...stepsStates })
    // return;
    // TODO: add logic to backfill data
    const imperialDataReadyForBulkCall = prepareDataForBulkIndexing(imperialJSONLFileNames, 'imperial');
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(imperialDataReadyForBulkCall, 'imperial')
    }
  }

  if (metricJSONLFileNames.length === 0) {
    stage = step[5]
    stepsStates = updateProgressState({ backfillDataFromFile: true }, { info: `no new files, reading exisiting metric data from file` }, mainLogger, { ...stepsStates })
    // return;
    // TODO: add logic to backfill data
    const metricDataReadyForBulkCall = prepareDataForBulkIndexing(metricJSONLFileNames, 'metric');
    console.log('9. HELLO!!!!!!!!!!!!!!!!!!')
    if (stepsStates.clusterError === false) {
      await dataIndexer.bulkIndexDocuments(metricDataReadyForBulkCall, 'metric')
    }
  }
  if (!stepsStates.fatalError === true) {
    mainLogger.logInfo('DONE', stepsStates)
    console.log('10. DONE!!!!!!!!!!!!!!!!!!')
    return 'DONE'
  } else {
    mainLogger.logError('[ERROR] [STEPSSTATE]:', stepsStates)
    console.log()
    mainLogger.logError('[ERROR] [STAGE]:', stage)
    console.log()
  }
};

module.exports = main;
