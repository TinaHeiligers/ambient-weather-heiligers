const fs = require('file-system');
const path = require('path');
const moment = require('moment');
const cu = require('convert-units');

function convertTemp(f) {
  const tempInC = cu(f).from('F').to('C');
  return Number((tempInC).toFixed(3));
}
function convertMPH(mph) {
  const speedmph = cu(mph).from('m/h').to('m/s');
  return Number((speedmph).toFixed(3));
}




//generic filename getter
const getArrayOfFiles = (pathToFolder) => {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  let filesArray = [];
  const files = fs.readdirSync(directoryPath);
  files.forEach(file => filesArray.push((`${file}`).split('.')[0]));
  console.log('filesArrayInFunction', filesArray)
  return filesArray;
}

// first get the files that have been converted
const allConvertedFiles = getArrayOfFiles('ambient-weather-heiligers-data-metric');
const allRawFiles = getArrayOfFiles('ambient-weather-heiligers-data');
console.log('allRawFilesFinal', allRawFiles)


return allRawFiles;

// path to read the unconverted raw data from
const dataReadDirectoryPath = path.join(__dirname, 'data/ambient-weather-heiligers-data');


// const dataFileRead = JSON.parse(fs.readFileSync(`./data/ambient-weather-heiligers-data/${dateFromFileName}.json`));
// async function convertData() {
//   const metricData = allData.map(datum => {
//     const convertedDatum = {
//       date_utc: datum.dateutc,
//       temp_inside_c: convertTemp(datum.tempinf),
//       humidity_in: datum.humidityin,
//       barom_rel_in: datum.baromrelin,
//       barom_abs_in: datum.baromabsin,
//       temp_outside_c: convertTemp(datum.tempf),
//       battery_condition: datum.battout === 1 ? 'good' : 'bad',
//       humidity_percent: datum.humidity,
//       wind_dir_degrees: datum.winddir,
//       windspeed_mps: convertMPH(datum.windspeedmph),
//       windgust_mps: convertMPH(datum.windgustmph),
//       max_daily_gust: convertMPH(datum.maxdailygust),
//       hourly_rain_mm: datum.hourlyrainin !== 0 ? cu(datum.hourlyrainin).from('in').to('mm') : 0,
//       event_rain_mm: datum.eventrainin !== 0 ? cu(datum.eventrainin).from('in').to('mm') : 0,
//       daily_rain_mm: datum.dailyrainin !== 0 ? cu(datum.dailyrainin).from('in').to('mm') : 0,
//       weekly_rain_mm: datum.weeklyrainin !== 0 ? cu(datum.weeklyrainin).from('in').to('mm') : 0,
//       monthly_rain_mm: datum.monthlyrain !== 0 ? cu(datum.monthlyrainin).from('in').to('mm') : 0,
//       total_rain_mm: datum.totalrainin !== 0 ? cu(datum.totalrainin).from('in').to('mm') : 0,
//       solar_radiation_W_msq: datum.solarradiation,
//       uv: datum.uv,
//       feels_like_outside_c: convertTemp(datum.feelsLike),
//       dewpoint_c: convertTemp(datum.dewPoint),
//       feelslike_insideC: convertTemp(datum.feelsLikein),
//       dewpoint_insideC: convertTemp(datum.dewPointin),
//       loc: datum.loc,
//       date: moment(datum.date).local().format(),
//     }

//     return convertedDatum;
//   });
//   fs.writeFile(`./data/test/${humanReadibleDate}.json`, JSON.stringify(metricData, null, 2));
//   return metricData;
// }

// return fetchRecentData();


