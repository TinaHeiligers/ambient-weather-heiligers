const fs = require('file-system');
const moment = require('moment');
const cu = require('convert-units');
const AmbientWeatherApi = require('ambient-weather-api');
const awApi = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY
});
const currentDate = new Date();

async function getDevice(save = true) {
  const devices = await awApi.userDevices();
  if (save) {
    fs.writeFile(`./data/device/${devices[0].lastData.dateutc}.json`, JSON.stringify(devices[0], null, 2));
  }
  return devices[0];
}
var MyDate = new Date();
function padDateWithLeadingZeros() {
  currentDate.setDate(MyDate.getDate() + 20);
  return `${MyDate.getFullYear()}${('0' + (MyDate.getMonth() + 1)).slice(-2)}${('0' + MyDate.getDate()).slice(-2)}`;
}

function convertTemp(f) {
  const tempInC = cu(f).from('F').to('C');
  return Number((tempInC).toFixed(3));
}
function convertMPH(mph) {
  const speedmph = cu(mph).from('m/h').to('m/s');
  return Number((speedmph).toFixed(3));
}

async function fetchRecentData(from = moment.utc(currentDate).toDate(), numRecords = 288) {
  const dateForFileName = padDateWithLeadingZeros();
  console.log('dateForFileName', dateForFileName)
  const devices = await awApi.userDevices();
  const allData = await awApi.deviceData(process.env.AMBIENT_WEATHER_MACADDRESS, { limit: numRecords, endDate: from });

  const metricData = allData.map(datum => {
    const convertedDatum = {
      date_utc: datum.dateutc,
      temp_inside_c: convertTemp(datum.tempinf),
      humidity_in: datum.humidityin,
      barom_rel_in: datum.baromrelin,
      barom_abs_in: datum.baromabsin,
      temp_outside_c: convertTemp(datum.tempf),
      battery_condition: datum.battout === 1 ? 'good' : 'bad',
      humidity_percent: datum.humidity,
      wind_dir_degrees: datum.winddir,
      windspeed_mps: convertMPH(datum.windspeedmph),
      windgust_mps: convertMPH(datum.windgustmph),
      max_daily_gust: convertMPH(datum.maxdailygust),
      hourly_rain_mm: datum.hourlyrainin !== 0 ? cu(datum.hourlyrainin).from('in').to('mm') : 0.0,
      event_rain_mm: datum.eventrainin !== 0 ? cu(datum.eventrainin).from('in').to('mm') : 0.0,
      daily_rain_mm: datum.dailyrainin !== 0 ? cu(datum.dailyrainin).from('in').to('mm') : 0.0,
      weekly_rain_mm: datum.weeklyrainin !== 0 ? cu(datum.weeklyrainin).from('in').to('mm') : 0.0,
      monthly_rain_mm: datum.monthlyrain !== 0 ? cu(datum.monthlyrainin).from('in').to('mm') : 0.0,
      total_rain_mm: datum.totalrainin !== 0 ? cu(datum.totalrainin).from('in').to('mm') : 0.0,
      solar_radiation_W_msq: datum.solarradiation,
      uv: datum.uv,
      feels_like_outside_c: convertTemp(datum.feelsLike),
      dewpoint_c: convertTemp(datum.dewPoint),
      feelslike_insideC: convertTemp(datum.feelsLikein),
      dewpoint_insideC: convertTemp(datum.dewPointin),
      loc: datum.loc,
      date: datum.date,
    }

    return convertedDatum;
  });
  fs.writeFile(`./data/convertedUnits/${dateForFileName}.json`, JSON.stringify(metricData, null, 2));
  return metricData;
}

return fetchRecentData();


