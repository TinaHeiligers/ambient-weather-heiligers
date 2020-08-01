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
  // console.log('filesArrayInFunction', filesArray)
  return filesArray;
}

async function convertData() {
  const allConvertedFiles = getArrayOfFiles('ambient-weather-heiligers-data-metric');
  const allRawFiles = getArrayOfFiles('ambient-weather-heiligers-imperial');
  const filesToConvert = allRawFiles.filter(element => allConvertedFiles.indexOf(element) === -1);

  let convertedCount = 0;

  if (filesToConvert.length > 0) {
    filesToConvert.forEach((entry, index) => {
      console.log('converting entry:', entry)
      const dataFileRead = JSON.parse(fs.readFileSync(`./data/ambient-weather-heiligers-data/${entry}.json`));
      // console.log('dataFileRead', dataFileRead)
      const arrayOfConvertedData = dataFileRead.map(datum => {
        return {
          ...datum,
          temp_inside_c: convertTemp(datum.tempinf),
          temp_outside_c: convertTemp(datum.tempf),
          battery_condition: datum.battout === 1 ? 'good' : 'bad',
          windspeed_meters_per_second: convertMPH(datum.windspeedmph),
          windgust_meters_per_second: convertMPH(datum.windgustmph),
          max_daily_gust: convertMPH(datum.maxdailygust),
          hourly_rain_mm: datum.hourlyrainin !== 0 ? cu(datum.hourlyrainin).from('in').to('mm') : 0,
          event_rain_mm: datum.eventrainin !== 0 ? cu(datum.eventrainin).from('in').to('mm') : 0,
          daily_rain_mm: datum.dailyrainin !== 0 ? cu(datum.dailyrainin).from('in').to('mm') : 0,
          weekly_rain_mm: datum.weeklyrainin !== 0 ? cu(datum.weeklyrainin).from('in').to('mm') : 0,
          monthly_rain_mm: datum.monthlyrain !== 0 ? cu(datum.monthlyrainin).from('in').to('mm') : 0,
          total_rain_mm: datum.totalrainin !== 0 ? cu(datum.totalrainin).from('in').to('mm') : 0,
          solar_radiation_watt_per_square_meter: datum.solarradiation,
          feels_like_outside_c: convertTemp(datum.feelsLike),
          dewpoint_c: convertTemp(datum.dewPoint),
          feelslike_inside_c: convertTemp(datum.feelsLikein),
          dewpoint_inside_c: convertTemp(datum.dewPointin),
        }
      });
      fs.writeFileSync(`./data/ambient-weather-heiligers-data-metric/${entry}.json`, JSON.stringify(arrayOfConvertedData, null, 2));
      convertedCount = convertedCount + 1;
      return arrayOfConvertedData;
    });
  };
  console.log('convertedCount', convertedCount)
  return convertedCount;
}


/// total method call:
return convertData();


