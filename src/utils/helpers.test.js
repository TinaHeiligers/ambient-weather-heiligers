const momentTZ = require("moment-timezone");
const {
  convertTemp,
  convertMPH,
  calcMinutesDiff,
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
    it("converts a speed from miles per hour to meters per second", () => {
      const speed = 45;
      const expected = Number(speed / 2.237).toFixed(3) * 1;
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
});