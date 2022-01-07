const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');

const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});

async function main() {
  let dataFileNames;
  let dataFetchForDates;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexDocsNeeded = false;
  const pathToMetricJsonlFiles = 'ambient-weather-heiligers-metric-jsonl'; // jsonl form of metric data already converted
  const pathToImperialDataFiles = 'ambient-weather-heiligers-imperial'; // raw imperial data in json form
  // initialize the classes;
  const mainLogger = new Logger('main');

  mainLogger.logInfo('starting main function', new Date());

  const fetchRawDataTester = new FetchRawData(awApi, fs);
  const imperialToJsonlConverter = new ConvertImperialToJsonl(fs);
  const imperialToMetricJsonlConverter = new ConvertImperialToMetric(fs);
  const dataIndexer = new IndexData();

  try {
    const result = await fetchRawDataTester.getDataForDateRanges(false);
    const { imperial, metric } = await dataIndexer.initialize();
    dataFileNames = result.dataFileNames;
    dataFetchForDates = result.dataFetchForDates;
    // logging info
    mainLogger.logInfo('dataFileNames', dataFileNames)
    mainLogger.logInfo('dataFetchForDates?', dataFetchForDates)
    mainLogger.logInfo('imperial', imperial);
    mainLogger.logInfo('metric', metric);
  } catch (err) {
    mainLogger.logError('error from fetchRawDataTester.getDataForDateRanges', err)
  };

  // the following workflow is to index new data as we get it. What this doesn't do is index data that we have on file but that isn't yet in the cluster indices.
  // convert and prepare for the bulk indexing call.
  if (dataFileNames && dataFileNames.length > 0 && indexDocsNeeded) {
    mainLogger.logInfo('beginning new data file conversion: json => jsonl')
    imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl()
    metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();
    // verify we need to index new data by comparing the date of the most recently indexed documents with the date from thos we've only just converted to JSONL
    // if (imperialDataJSONLFileNames.length > 0 | metricDataJSONLFileNames.length > 0) {

    // read the data from file
    // fs.read
    // await dataIndexer.prepareAndIndexBulk(imperialDataJSONLFileNames);
    // await dataIndexer.prepareAndIndexBulk(metricDataJSONLFileNames)
    // } else {
    // mainLogger.logWarning('no new data files emitted, is skipSave perhaps enabled?')
  }

  return { newImperialFiles: imperialDataJSONLFileNames, newMetricFiles: metricDataJSONLFileNames }
}
main()
module.exports = main
