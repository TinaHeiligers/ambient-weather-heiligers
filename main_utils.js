const fs = require('file-system');
const Logger = require('./src/logger');

const mainUtilsLogger = new Logger('main_utils');
const mockedFileNamesArray = [
  '1641684000000_1641752460000',
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
  'data/ambient-weather-heiligers-imperial-jsonl/1641684000000_1641752460000.jsonl',
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

function prepareDataForBulkIndexing(fileNamesArray, dataType, logger) {
  let preparedData = [];
  let readJsonlData = [];
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
      // console.log("-->", line);
      // console.log("---->>>{ index: { _index: `ambient_weather_heiligers_${dataType}*` } }, line)
      return [{ index: { _index: `ambient_weather_heiligers_${dataType}*` } }, JSON.parse(line)]
      // console.log("-->", line);
      // return JSON.parse(line);
    });
  });
  return dataReadyForBulkIndexing;
}

function getAllFilesFromPath(fullPathToFiles) {
  console.log('in getAllFilesFromPath with fullPathToFiles as:', fullPathToFiles)
  const files = fs.readdirSync(fullPathToFiles);
  let filesArray = [];// an array of filenames without the extension type: string[] | []
  filesArray = files
    .map((file) => (`${file}`.split(".")[0])).filter((fileName => fileName.length > 0));
  console.log('finished reading the dir, with a result of filesArray:', filesArray);
  return filesArray;
}

const results = prepareDataForBulkIndexing(mockedFileNamesArray, mockedDataType, mainUtilsLogger);
console.log('results', results);
/**example of what we have now:
 * { index: [Object] },
    {
      dateutc: 1641824400000,
      tempinf: 70.3,
      humidityin: 37,
      baromrelin: 30.434,
      baromabsin: 29.029,
      tempf: 45.3,
      battout: 1,
      humidity: 65,
      winddir: 34,
      windspeedmph: 0,
      windgustmph: 0,
      maxdailygust: 8.1,
      hourlyrainin: 0,
      eventrainin: 0,
      dailyrainin: 0,
      weeklyrainin: 0,
      monthlyrainin: 0.39,
      totalrainin: 12.02,
      solarradiation: 0,
      uv: 0,
      feelsLike: 45.3,
      dewPoint: 34.24,
      feelsLikein: 68.8,
      dewPointin: 42.8,
      lastRain: '2022-01-01T10:43:00.000Z',
      loc: 'ambient-prod-2',
      date: '2022-01-10T14:20:00.000Z'
    },
 */
module.exports = {
  prepareDataForBulkIndexing,
  getAllFilesFromPath,
}
    // read the data and add the extra stuff we need for bulkIndexing.
    // convert it to the shape we expect to pass into bulkIndex,
    // example doc is:
    // {"date":"2022-01-09T00:55:00.000Z","dateutc":1641689700000,"loc":"ambient-prod-1","last_rain":"2022-01-01T10:43:00.000Z","uv":0,"wind_dir":320,"humidity":56,"humidity_inside":39,"barometer_abs_bar":9718.259152,"barometer_rel_bar":10194.385446,"temp_inside_c":21.778,"temp_outside_c":14.5,"battery_condition":"good","windspeed_km_per_hr":0,"windgust_km_per_hr":0,"max_daily_gust_km_per_hr":11.104,"hourly_rain_mm":0,"event_rain_mm":0,"daily_rain_mm":0,"weekly_rain_mm":0,"monthly_rain_mm":10,"total_rain_mm":305,"solar_radiation_W_per_sq_m":0,"feels_like_outside_c":14.5,"dewpoint_c":5.828,"feelslike_inside_c":21.056,"dewpoint_inside_c":7.222}
