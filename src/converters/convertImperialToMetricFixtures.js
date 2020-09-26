const { convertToMetric } = require('../utils');
const mockedImperialData = [
  {
    "dateutc": 1595094900000,
    "tempinf": 81.5,
    "humidityin": 41,
    "baromrelin": 29.965,
    "baromabsin": 28.621,
    "tempf": 103.5,
    "battout": 1,
    "humidity": 21,
    "winddir": 167,
    "windspeedmph": 1.8,
    "windgustmph": 3.4,
    "maxdailygust": 4.5,
    "hourlyrainin": 0,
    "eventrainin": 0,
    "dailyrainin": 0,
    "weeklyrainin": 0,
    "monthlyrainin": 0,
    "totalrainin": 0.071,
    "solarradiation": 956.05,
    "uv": 9,
    "feelsLike": 102.71,
    "dewPoint": 55.86,
    "feelsLikein": 81.1,
    "dewPointin": 55.5,
    "lastRain": "2020-06-06T03:34:00.000Z",
    "loc": "ambient-prod-2020-29",
    "date": "2020-07-18T17:55:00.000Z"
  },
  {
    "dateutc": 1595094600000,
    "tempinf": 81.7,
    "humidityin": 42,
    "baromrelin": 29.962,
    "baromabsin": 28.618,
    "tempf": 102.2,
    "battout": 1,
    "humidity": 23,
    "winddir": 169,
    "windspeedmph": 1.8,
    "windgustmph": 2.2,
    "maxdailygust": 4.5,
    "hourlyrainin": 0,
    "eventrainin": 0,
    "dailyrainin": 0,
    "weeklyrainin": 0,
    "monthlyrainin": 0,
    "totalrainin": 0.071,
    "solarradiation": 978.2,
    "uv": 9,
    "feelsLike": 101.89,
    "dewPoint": 57.31,
    "feelsLikein": 81.4,
    "dewPointin": 56.3,
    "lastRain": "2020-06-06T03:34:00.000Z",
    "loc": "ambient-prod-2020-29",
    "date": "2020-07-18T17:50:00.000Z"
  },
  {
    "dateutc": 1595094300000,
    "tempinf": 81.3,
    "humidityin": 41,
    "baromrelin": 29.965,
    "baromabsin": 28.621,
    "tempf": 102.9,
    "battout": 1,
    "humidity": 21,
    "winddir": 185,
    "windspeedmph": 1.1,
    "windgustmph": 2.2,
    "maxdailygust": 4.5,
    "hourlyrainin": 0,
    "eventrainin": 0,
    "dailyrainin": 0,
    "weeklyrainin": 0,
    "monthlyrainin": 0,
    "totalrainin": 0.071,
    "solarradiation": 999,
    "uv": 9,
    "feelsLike": 101.85,
    "dewPoint": 55.37,
    "feelsLikein": 81,
    "dewPointin": 55.3,
    "lastRain": "2020-06-06T03:34:00.000Z",
    "loc": "ambient-prod-2020-29",
    "date": "2020-07-18T17:45:00.000Z"
  }
];

const mockedMetricData = [{
  date: '2020-07-18T17:55:00.000Z',
  dateutc: 1595094900000,
  loc: 'ambient-prod-2020-29',
  last_rain: '2020-06-06T03:34:00.000Z',
  uv: 9,
  wind_dir: 167,
  humidity: 21,
  humidity_inside: 41,
  barometer_abs_bar: 9692.183957,
  barometer_rel_bar: 10147.314639,
  temp_inside_c: 27.5,
  temp_outside_c: 39.722,
  battery_condition: 'good',
  windspeed_km_per_hr: 2.897,
  windgust_km_per_hr: 5.472,
  max_daily_gust_km_per_hr: 7.242,
  hourly_rain_mm: 0,
  event_rain_mm: 0,
  daily_rain_mm: 0,
  weekly_rain_mm: 0,
  monthly_rain_mm: 0,
  total_rain_mm: 2,
  solar_radiation_W_per_sq_m: 956.05,
  feels_like_outside_c: 39.283,
  dewpoint_c: 13.256,
  feelslike_inside_c: 27.278,
  dewpoint_inside_c: 13.056
},
{
  date: '2020-07-18T17:50:00.000Z',
  dateutc: 1595094600000,
  loc: 'ambient-prod-2020-29',
  last_rain: '2020-06-06T03:34:00.000Z',
  uv: 9,
  wind_dir: 169,
  humidity: 23,
  humidity_inside: 42,
  barometer_abs_bar: 9691.16804,
  barometer_rel_bar: 10146.298722,
  temp_inside_c: 27.611,
  temp_outside_c: 39,
  battery_condition: 'good',
  windspeed_km_per_hr: 2.897,
  windgust_km_per_hr: 3.541,
  max_daily_gust_km_per_hr: 7.242,
  hourly_rain_mm: 0,
  event_rain_mm: 0,
  daily_rain_mm: 0,
  weekly_rain_mm: 0,
  monthly_rain_mm: 0,
  total_rain_mm: 2,
  solar_radiation_W_per_sq_m: 978.2,
  feels_like_outside_c: 38.828,
  dewpoint_c: 14.061,
  feelslike_inside_c: 27.444,
  dewpoint_inside_c: 13.5
},
{
  date: '2020-07-18T17:45:00.000Z',
  dateutc: 1595094300000,
  loc: 'ambient-prod-2020-29',
  last_rain: '2020-06-06T03:34:00.000Z',
  uv: 9,
  wind_dir: 185,
  humidity: 21,
  humidity_inside: 41,
  barometer_abs_bar: 9692.183957,
  barometer_rel_bar: 10147.314639,
  temp_inside_c: 27.389,
  temp_outside_c: 39.389,
  battery_condition: 'good',
  windspeed_km_per_hr: 1.77,
  windgust_km_per_hr: 3.541,
  max_daily_gust_km_per_hr: 7.242,
  hourly_rain_mm: 0,
  event_rain_mm: 0,
  daily_rain_mm: 0,
  weekly_rain_mm: 0,
  monthly_rain_mm: 0,
  total_rain_mm: 2,
  solar_radiation_W_per_sq_m: 999,
  feels_like_outside_c: 38.806,
  dewpoint_c: 12.983,
  feelslike_inside_c: 27.222,
  dewpoint_inside_c: 12.944
}];

module.exports = {
  mockedImperialData,
  mockedMetricData
};
