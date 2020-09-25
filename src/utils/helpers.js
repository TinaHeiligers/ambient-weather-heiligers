const cu = require("convert-units");
const momentTZ = require("moment-timezone");

const convertTemp = function (f) {
  const tempInC = cu(f).from("F").to("C");
  return Number(tempInC.toFixed(3));
};

const convertMPH = function (mph) {
  const speedmph = cu(mph).from("m/h").to("km/h");
  return Number(speedmph.toFixed(3));
};

const calcMinutesDiff = (to, from) => {
  return momentTZ.duration(momentTZ(to).diff(momentTZ(from))).as("minutes");
};

function convertToMetric(datum) {
  if (!datum) return;
  return {
    ...datum,
    temp_inside_c: convertTemp(datum.tempinf),
    temp_outside_c: convertTemp(datum.tempf),
    battery_condition: datum.battout === 1 ? 'good' : 'bad',
    windspeed_km_per_hr: convertMPH(datum.windspeedmph),
    windgust_km_per_hr: convertMPH(datum.windgustmph),
    max_daily_gust: convertMPH(datum.maxdailygust),
    hourly_rain_mm: datum.hourlyrainin !== 0 ? cu(datum.hourlyrainin).from('in').to('mm') : 0.0,
    event_rain_mm: datum.eventrainin !== 0 ? cu(datum.eventrainin).from('in').to('mm') : 0.0,
    daily_rain_mm: datum.dailyrainin !== 0 ? cu(datum.dailyrainin).from('in').to('mm') : 0.0,
    weekly_rain_mm: datum.weeklyrainin !== 0 ? cu(datum.weeklyrainin).from('in').to('mm') : 0.0,
    monthly_rain_mm: datum.monthlyrain !== 0 ? cu(datum.monthlyrainin).from('in').to('mm') : 0.0,
    total_rain_mm: datum.totalrainin !== 0 ? cu(datum.totalrainin).from('in').to('mm') : 0.0,
    solar_radiation_watt_per_square_meter: datum.solarradiation,
    feels_like_outside_c: convertTemp(datum.feelsLike),
    dewpoint_c: convertTemp(datum.dewPoint),
    feelslike_inside_c: convertTemp(datum.feelsLikein),
    dewpoint_inside_c: convertTemp(datum.dewPointin),
  }
}

module.exports = {
  convertTemp,
  convertMPH,
  calcMinutesDiff,
  convertToMetric
};
