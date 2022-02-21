const fs = require('file-system');
const Logger = require('./src/logger');

const mainUtilsLogger = new Logger('main_utils');
const mockedFileNamesArray = [
  // '1641684000000_1641752460000',
  // '1641752700000_1641839100000',
  // '1641839400000_1641858900000',
  // '1641859500000_1641945300000',
  // '1641945600000_1642031400000',
  // '1642031700000_1642117500000',
  // '1642117800000_1642203600000',
  // '1642203900000_1642290300000',
  // '1642290600000_1642290900000',
  // '1642291200000_1642291200000',
  // '1642291500000_1642350600000',
  // '1642350900000_1642362300000',
  // '1642362600000_1642371000000',
  // '1642371360000_1642377360000',
  // '20211231-T-1900_20211231-T-2125',
  // '20211231-T-2130_20220101-T-2120',
  // '20220101-T-1815_20220102-T-1805',
  // '20220101-T-2125_20220102-T-2115',
  // '20220102-T-1810_20220103-T-1811',
  // '20220102-T-2120_20220103-T-2120',
  // '20220103-T-1815_20220104-T-1805',
  // '20220103-T-2125_20220104-T-2115',
  // '20220104-T-1810_20220105-T-1800',
  // '20220104-T-2120_20220105-T-2110',
  // '20220105-T-1805_20220106-T-1756',
  // '20220105-T-2115_20220106-T-2105',
  // '20220106-T-2110_20220107-T-2100',
  // '20220107-T-2105_20220108-T-2100',
  // '20220108-T-2105_20220108-T-2315',
  // '20220108-T-2320_20220109-T-0050',
  // '20220109-T-0055_20220109-T-0100'
];

const mockedFullFilePaths = [
  // 'data/ambient-weather-heiligers-imperial-jsonl/1641684000000_1641752460000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1641752700000_1641839100000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1641839400000_1641858900000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1641859500000_1641945300000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1641945600000_1642031400000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642031700000_1642117500000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642117800000_1642203600000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642203900000_1642290300000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642290600000_1642290900000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642291200000_1642291200000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642291500000_1642350600000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642350900000_1642362300000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642362600000_1642371000000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/1642371360000_1642377360000.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20211231-T-1900_20211231-T-2125.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20211231-T-2130_20220101-T-2120.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220101-T-1815_20220102-T-1805.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220101-T-2125_20220102-T-2115.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220102-T-1810_20220103-T-1811.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220102-T-2120_20220103-T-2120.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220103-T-1815_20220104-T-1805.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220103-T-2125_20220104-T-2115.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220104-T-1810_20220105-T-1800.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220104-T-2120_20220105-T-2110.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220105-T-1805_20220106-T-1756.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220105-T-2115_20220106-T-2105.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220106-T-2110_20220107-T-2100.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220107-T-2105_20220108-T-2100.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220108-T-2105_20220108-T-2315.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220108-T-2320_20220109-T-0050.jsonl',
  // 'data/ambient-weather-heiligers-imperial-jsonl/20220109-T-0055_20220109-T-0100.jsonl'
];
const mockedDataType = 'imperial';

/**
 *
 * @param {array} fileNamesArray
 * @param {string} dataType
 * @param {Logger} logger
 * @returns {array} flat array containing bulk payload to send to cluster.
 * @example
 // const results = prepareDataForBulkIndexing(mockedFileNamesArray, mockedDataType, mainUtilsLogger);
/**
 * { index: { _index: `ambient_weather_heiligers_${dataType}*` } },
    {
      dateutc: 1641824400000,
      tempinf: 70.3,
      humidityin: 37,
      ...,
      date: '2022-01-10T14:20:00.000Z'
    },
 */
function prepareDataForBulkIndexing(fileNamesArray, dataType, logger) {
  let preparedData = [];
  let readJsonlData = [];
  const targetAlias = `all-ambient-weather-heiligers-${dataType}`;
  // fetch and read the data first
  const fullPathToFilesToRead = `data/ambient-weather-heiligers-${dataType}-jsonl`; // can be moved to the top.
  if (fileNamesArray.length === 0) {
    console.log('fileNamesArray is empty')
    fileNamesArray = getAllFilesFromPath(fullPathToFilesToRead); // get everything
  }
  const fullFilePaths = fileNamesArray.map(filename => `${fullPathToFilesToRead}/${filename}.jsonl`);

  const dataReadyForBulkIndexing = fullFilePaths.flatMap(fullPath => {
    if (Object.keys(fullPath).length === 0) return true;
    const dataFileRead = fs.readFileSync(fullPath);
    //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
    return dataFileRead.toString().trim().split("\n").flatMap((line) => {
      return [{ index: { _index: targetAlias } }, JSON.parse(line)]
    });
  });
  return dataReadyForBulkIndexing;
}

/**
 *
 * @param {string} fullPathToFiles
 * @returns {string[]} fileNames array without the extension
 */
function getAllFilesFromPath(fullPathToFiles) {
  const files = fs.readdirSync(fullPathToFiles);
  let filesArray = [];
  filesArray = files
    .map((file) => (`${file}`.split(".")[0])).filter((fileName => fileName.length > 0));
  return filesArray;
}

module.exports = {
  prepareDataForBulkIndexing,
}
