const momentTZ = require("moment-timezone");
const {
  convertTemp,
  convertMPH,
  getLastRecordedUTCDate,
  calcMinutesDiff,
  extractDataInfo,
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
  describe("extractDataInfo", () => {
    it("should extract the min and max dates for an array of data containing dates", () => {
      const to1 = "2020-06-20";
      const from1 = "2020-06-19";
      const to2 = "2020-06-22";
      const from2 = "2020-06-21";
      const testArray = [{ date: from1 }, { date: from2 }];
      expect(extractDataInfo(testArray)).toEqual({
        from: momentTZ(from1),
        to: momentTZ(from2),
      });
    });
  });
  describe.skip("getLastRecordedUTCDate", () => {
    // TODO: add mock return values for the fs methods and path.
    // const testItem = getLastRecordedUTCDate([momentTZ.utc()]);
    it.todo("should use mocks for fs");
    it.todo("should read the files from the filepath provided");
    it.todo("should not fail if there are no files in the filepath");
    it.todo("should get the most recent data point date for each file");
    it.todo("should retrieve the most recent date point date");
  });

});
