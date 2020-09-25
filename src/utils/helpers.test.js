const momentTZ = require("moment-timezone");
const {
  convertTemp,
  convertMPH,
  calcMinutesDiff,
  convertToMetric
} = require("./helpers");

describe("helpers", () => {
  describe("convertTemp", () => {
    it("converts a temperature to celsius", () => {
      const temp = 100;
      const expected = (temp - 32) * (5 / 9);
      const actual = convertTemp(temp);
      expect(actual).toEqual(Number(expected).toFixed(3) * 1);
    });
  });
  describe("convertMPH", () => {
    it("converts a speed from miles per hour to kilometers per hour", () => {
      const speed = 45;
      const expected = Number(speed * 1.609).toFixed(3) * 1;
      const actual = convertMPH(speed);
      expect(Math.ceil(expected) - Math.ceil(actual)).toEqual(0);
    });
  });
  describe("calcMinutesDiff", () => {
    it("calculates the difference between two date times in minutes", () => {
      const dateTime1 = momentTZ('2020-06-01').add(1, 'days');
      const dateTime2 = momentTZ('2020-06-01');
      const expected = 24 * 60;
      const actual = calcMinutesDiff(dateTime1, dateTime2);
      expect(actual).toEqual(expected);
    });
  });
  describe("convertToMetric", () => {
    it("converts imperial units to metric units", () => {
      const imperialData = {
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
      }
      const expectedMeticData = {
        ...datum,
        temp_inside_c: 27.5,
        temp_outside_c: 39.722222,
        battery_condition: 1,
        windspeed_km_per_hr: 0.804672,
        windgust_km_per_hr: 1.51994,
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
    })
  })
});
