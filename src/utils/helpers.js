const cu = require("convert-units");
const momentTZ = require("moment-timezone");
const moment = require('moment')
const timeConstants = require('./constants')

const convertTemp = function (f) {
  const tempInC = cu(f).from("F").to("C");
  return Number(tempInC.toFixed(3));
};

const convertMPH = function (mph) {
  const speedmph = cu(mph).from("m/h").to("km/h");
  return Number(speedmph.toFixed(3));
};
/**
 * calculate the number of minutes between two date-times in milliseconds
 * note: javascript uses milliseconds as the unit to `getTime()`
 * @param {number} to date-time in milliseconds
 * @param {number} from date-time in milliseconds
 * @returns number of minutes difference
 */
const calcMinutesDiff = (to, from) => {
  return Math.floor((to - from) / (timeConstants.milliseconds_per_second * timeConstants.seconds_per_minute))
};


function convertRainReading(reading) {
  if (reading !== 0) {
    const converted = cu(reading).from('in').to('mm');
    return Number((converted).toFixed(0));
  }
  return 0.0;
};

function convertToMetric(datum) {
  if (!datum) return;
  return {
    date: datum.date,
    dateutc: datum.dateutc,
    loc: datum.loc,
    last_rain: datum.lastRain,
    uv: datum.uv,
    wind_dir: datum.winddir,
    humidity: datum.humidity,
    humidity_inside: datum.humidityin,
    barometer_abs_bar: Number((datum.baromabsin * (3386.389) * 0.1).toFixed(6)),
    barometer_rel_bar: Number((datum.baromrelin * (3386.389) * 0.1).toFixed(6)),
    temp_inside_c: convertTemp(datum.tempinf),
    temp_outside_c: convertTemp(datum.tempf),
    battery_condition: datum.battout === 1 ? 'good' : 'bad',
    windspeed_km_per_hr: convertMPH(datum.windspeedmph),
    windgust_km_per_hr: convertMPH(datum.windgustmph),
    max_daily_gust_km_per_hr: convertMPH(datum.maxdailygust),
    hourly_rain_mm: convertRainReading(datum.hourlyrainin),
    event_rain_mm: convertRainReading(datum.eventrainin),
    daily_rain_mm: convertRainReading(datum.dailyrainin),
    weekly_rain_mm: convertRainReading(datum.weeklyrainin),
    monthly_rain_mm: convertRainReading(datum.monthlyrainin),
    total_rain_mm: convertRainReading(datum.totalrainin),
    solar_radiation_W_per_sq_m: datum.solarradiation,
    feels_like_outside_c: convertTemp(datum.feelsLike),
    dewpoint_c: convertTemp(datum.dewPoint),
    feelslike_inside_c: convertTemp(datum.feelsLikein),
    dewpoint_inside_c: convertTemp(datum.dewPointin),
  }
}
/**
 *
 * @param {Array} fromToObjsArray: array of { from: <datetime>, to: <datetime> }
 * objects where datetime could either be a momentTZ datestring or a date-time in
 * milliseconds
 */
const minDateFromDateObjects = (fromToObjsArray) => {
  const allDates = fromToObjsArray.reduce(function (acc, obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (acc.indexOf(value) === -1) acc.push(value) // collect all the dates
    }
    return acc;
  }, []);
  if (allDates.every(item => typeof item === Number)) {
    return Math.min(...allDates);
  } else {
    const allDatesAsNumbers = allDates.map((item => typeof item !== Number ? Date.parse(momentTZ(item)) : item));
    return Math.min(...allDatesAsNumbers);
  }
}

module.exports = {
  convertTemp,
  convertMPH,
  calcMinutesDiff,
  convertToMetric,
  minDateFromDateObjects
};
