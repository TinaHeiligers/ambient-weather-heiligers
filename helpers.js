const cu = require("convert-units");
const path = require("path");
const fs = require("fs");
const momentTZ = require("moment-timezone");

const convertTemp = function (f) {
  const tempInC = cu(f).from("F").to("C");
  return Number(tempInC.toFixed(3));
};

const convertMPH = function (mph) {
  const speedmph = cu(mph).from("m/h").to("m/s");
  return Number(speedmph.toFixed(3));
};

//generic mostRecentDate getter from existing data files
const getLastRecordedUTCDate = function (pathToFolder) {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  const files = fs.readdirSync(directoryPath);
  const maxFileEntriesDatesArray = files.map((file) => {
    // get the max date from ONE file
    const data = JSON.parse(fs.readFileSync(`data/${pathToFolder}/${file}`)); // is an array of objects
    dataDates = data.map((datum) => momentTZ(datum.date));
    return momentTZ.max(dataDates);
  });
  const mostRecentDate = momentTZ.max(maxFileEntriesDatesArray);
  return momentTZ.utc(mostRecentDate);
};

const padDateWithLeadingZeros = (date) => {
  date.setDate(date.getDate());
  return `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${(
    "0" + date.getDate()
  ).slice(-2)}`;
};
const calcMinutesDiff = (to, from) => {
  return momentTZ.duration(momentTZ(to).diff(momentTZ(from))).as("minutes");
};
const extractDataInfo = (dataArray) => {
  const dataDates = dataArray.map((datum) => momentTZ(datum.date));
  const dataFrom = momentTZ.min(dataDates);
  const dataTo = momentTZ.max(dataDates);
  return { from: dataFrom, to: dataTo };
};

module.exports = {
  convertTemp,
  convertMPH,
  getLastRecordedUTCDate,
  padDateWithLeadingZeros,
  calcMinutesDiff,
  extractDataInfo,
};
