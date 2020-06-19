const cu = require('convert-units');
const path = require('path');
const fs = require('fs');
const momentTZ = require('moment-timezone');

module.exports.convertTemp = function (f) {
  const tempInC = cu(f).from('F').to('C');
  return Number((tempInC).toFixed(3));
}

module.exports.convertMPH = function (mph) {
  const speedmph = cu(mph).from('m/h').to('m/s');
  return Number((speedmph).toFixed(3));
}

//generic mostRecentDate getter from existing data files
const getMostRecentDataDate = function (pathToFolder) {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  let filesArray = [];
  const files = fs.readdirSync(directoryPath);
  files.forEach(file => filesArray.push((`${file}`).split('.')[0]));
  // console.log('filesArrayInFunction', filesArray)
  let mostRecentFileName = filesArray.sort()[filesArray.length - 1];
  //read the file contents to fetch the most recent date item
  const data = JSON.parse(fs.readFileSync(`./data/ambient-weather-heiligers-data/${mostRecentFileName}.json`));
  const mostRecentDataUTCTime = data.map((entry) => entry.dateutc).sort()[data.length - 1];
  const mostRecentDataDate = data.find(dataPoint => dataPoint.dateutc === mostRecentDataUTCTime).date;
  return mostRecentDataDate;
}

const getDates = function (arrayOfExistingDataDates) {
  var dateArray = [];
  var lastRecordedDate = momentTZ(arrayOfExistingDataDates.sort()[arrayOfExistingDataDates.length - 1]).startOf('day');
  var currentDate = momentTZ().startOf('day');
  while (lastRecordedDate.add(1, 'days').diff(currentDate) < 0) {
    const formattedDate = momentTZ(lastRecordedDate.clone().toDate()).format('YYYYMMDD')
    dateArray.push(formattedDate);
  }
  return dateArray;
}

const padDateWithLeadingZeros = (date) => {
  date.setDate(date.getDate());
  return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
}

module.exports = { getMostRecentDataDate, getDates, padDateWithLeadingZeros }
