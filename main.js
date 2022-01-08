const AmbientWeatherApi = require('ambient-weather-api');
const fs = require('file-system');
const FetchRawData = require('./src/dataFetchers');
const { ConvertImperialToJsonl, ConvertImperialToMetric } = require('./src/converters');
const IndexData = require('./src/dataIndexers');
const Logger = require('./src/logger');

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

function main() {
  let newFilesNames;
  let datesForNewData;
  let imperialDataDate;
  let metricDataDate;
  let imperialDataJSONLFileNames;
  let metricDataJSONLFileNames;
  let indexDocsNeeded = false;
  const pathToMetricJsonlFiles = 'ambient-weather-heiligers-metric-jsonl'; // jsonl form of metric data already converted
  const pathToImperialDataFiles = 'ambient-weather-heiligers-imperial'; // raw imperial data in json form
  mainLogger.logInfo('starting main function', new Date());

  const getNewDataPromise = fetchRawDataTester.getDataForDateRanges(false)
    .then(res => {
      // {dataFetchForDates, dataFileNames}
      datesForNewData = res.dataFetchForDates;
      newFilesNames = res.dataFileNames;
      return res;
    }).catch(err => { throw new Error('fetchRawDataTester.getDataForDateRanges', err) });
  const getRecentIndexedDataDates = dataIndexer.initialize()
    .then(res => {
      imperialDataDate = res.imperialDataDate;
      metricDataDate = res.metricDataDate
      return res;
    })
    .catch(err => { throw new Error('dataIndexer.initialize', err) })
  const allValues = Promise.all([getNewDataPromise, getRecentIndexedDataDates]).then((values) => {
    console.log('values:', values);
    console.log('return from getDataForDateRanges', values[0])
    console.log('return from initialize', values[1])
    return values;
  })
  console.log('allValues?', allValues)
  // logging info
  // mainLogger.logInfo('dataFileNames', dataFileNames)
  // mainLogger.logInfo('dataFetchForDates', dataFetchForDates)
  // mainLogger.logInfo('imperial', imperialDataDate);
  // mainLogger.logInfo('metric', metricDataDate);
  // if date of most recently indexed documents is older than the earliest date in the new data, we need to index data)
  if (true) {
    mainLogger.logInfo('beginning new data file conversion: json => jsonl')
    imperialDataJSONLFileNames = imperialToJsonlConverter.convertRawImperialDataToJsonl()
    metricDataJSONLFileNames = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();

    return { newImperialFiles: imperialDataJSONLFileNames, newMetricFiles: metricDataJSONLFileNames }
    // now read the data in all the new files and compare the data date with that in the index. If the late is newer (more recent)
    // than the date in the index, add the datapoint to what needs to be formatted for bulk indexing.
  }
};

// the following workflow is to index new data as we get it. What this doesn't do is index data that we have on file but that isn't yet in the cluster indices.
// convert and prepare for the bulk indexing call.
// if (dataFileNames && dataFileNames.length > 0 && indexDocsNeeded) {

main()
module.exports = main
