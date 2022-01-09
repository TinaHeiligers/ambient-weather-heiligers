const momentTZ = require("moment-timezone");
const {
  convertTemp,
  convertMPH,
  calcMinutesDiff,
  convertToMetric,
  dateStringToFileNamePartialString,
  minDateFromDateObjectsArray
} = require("./helpers");
const timeConstants = require('./constants');

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
    it("calculates the difference between two moment-timezone objects in minutes", () => {
      const dateTime1 = momentTZ('2020-06-01').add(1, 'days');
      const dateTime2 = momentTZ('2020-06-01');
      const expected = 24 * 60;
      const actual = calcMinutesDiff(dateTime1, dateTime2);
      console.log(actual)
      expect(actual).toEqual(expected);
    });
    it("calculates the difference between two dates as date-time milliseconds since the unix epoch in minutes", () => {
      const dateTime1 = (new Date('2020-06-01')).getTime() + timeConstants.one_day_as_milliseconds;
      const dateTime2 = (new Date('2020-06-01')).getTime();
      const expected = 24 * 60;
      const actual = calcMinutesDiff(dateTime1, dateTime2);
      expect(actual).toEqual(expected)
    })
  });
  describe("convertToMetric", () => {
    it("converts imperial units to metric units", () => {
      const imperialDatum = {
        dateutc: 1595094900000,
        tempinf: 81.5,
        humidityin: 41,
        baromrelin: 29.965,
        baromabsin: 28.621,
        tempf: 103.5,
        battout: 1,
        humidity: 21,
        winddir: 167,
        windspeedmph: 1.8,
        windgustmph: 3.4,
        maxdailygust: 4.5,
        hourlyrainin: 0,
        eventrainin: 0,
        dailyrainin: 0,
        weeklyrainin: 0,
        monthlyrainin: 0,
        totalrainin: 0.071,
        solarradiation: 956.05,
        uv: 9,
        feelsLike: 102.71,
        dewPoint: 55.86,
        feelsLikein: 81.1,
        dewPointin: 55.5,
        lastRain: "2020-06-06T03:34:00.000Z",
        loc: "ambient-prod-2020-29",
        date: "2020-07-18T17:55:00.000Z"
      };
      const expectedMetricDatum = {
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
      };
      const actualResult = convertToMetric(imperialDatum);
      expect(actualResult).toEqual(expectedMetricDatum);
    });
  });
  describe("dateStringToFileNamePartialString", () => {
    it.todo('takes a string date and converts it to the momentDate format to match filenames')
  });
  describe("minDateFromDateObjectsArray", () => {
    it("extracts all dates from objects in the array and combines them into a single array", () => {
      const testFromToObj1 = { from: momentTZ('2022-01-07T14:05:00-07:00'), to: momentTZ('2022-01-06T14:10:00-07:00') };
      const testFromToObj2 = { from: momentTZ('2022-01-07T14:00:00-07:00'), to: momentTZ('2022-01-05T14:15:00-07:00') };
      const testArray = [testFromToObj1, testFromToObj2];
      const expectedMin = momentTZ.utc('2022-01-05T21:15:00.000Z');
      const actualMin = minDateFromDateObjectsArray(testArray);
      // comparing the dates directly throws "serializes to the same string". We use the alternative "isBefore" and "isAfter" instead
      expect(actualMin.isAfter(expectedMin)).toBe(false);
      expect(actualMin.isBefore(expectedMin)).toBe(false);
    })
  })

});
