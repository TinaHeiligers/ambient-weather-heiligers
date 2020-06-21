const momentTZ = require("moment-timezone");
const {
  convertTemp,
  convertMPH,
  getLastRecordedUTCDate,
  padDateWithLeadingZeros,
  calcMinutesDiff,
  extractDataInfo,
} = require("./helpers");

describe("helpers", () => {
  describe("convertTemp", () => {
    it("converts a temperature to celsius", () => {
      const temp = 100;
      const expected = (temp - 32) * (5 / 9);
      const actual = convertTemp(100);
      expect(actual).toEqual(Number(expected).toFixed(3) * 1);
    });
  });
  describe.skip("getLastRecordedUTCDate", () => {
    const testItem = getLastRecordedUTCDate([momentTZ.utc()]);
    it.todo("should use mocks for fs");
    it.todo("should read the files from the filepath provided");
    it.todo("should not fail if there are no files in the filepath");
    it.todo("should get the most recent data point date for each file");
    it.todo("should retrieve the most recent date point date");
  });
  describe("calcMinutesDiff", () => {
    let fromDate;
    let dateOfLastRecordSaved;
    beforeEach(() => {
      fromDate = momentTZ("2020-06-20T12:16:59-07:00").startOf("day");
      dateOfLastRecordSaved = momentTZ(fromDate.startOf("day")).subtract(
        3,
        "days"
      );
    });
    it("should calculate the number of minutes between two times", () => {
      const expected = 3 * 24 * 60;
      expect(calcMinutesDiff(fromDate, dateOfLastRecordSaved)).toEqual(
        expected
      );
    });
    it("should return a negative number if the dates are reversed", () => {
      const expected = -1 * (3 * 24 * 60);
      expect(calcMinutesDiff(dateOfLastRecordSaved, fromDate)).toEqual(
        expected
      );
    });
    it("should accept string versions of dates", () => {
      let to = "2020-01-02";
      let from = "2020-01-01";
      expect(calcMinutesDiff(to, from)).toEqual(24 * 60);
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
});
