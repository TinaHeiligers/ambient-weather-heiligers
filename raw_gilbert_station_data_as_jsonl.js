const fs = require('file-system');
const moment = require('moment')
// const date = "08-06-2020";

function padDateWithLeadingZeros(date) {
  // console.log('date:', new Date(date))
  // console.log(new Date(date).getDate())
  date.setDate(date.getDate());
  return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
}

function getDates(startDate, stopDate = startDate) {
  var dateArray = [];
  var currentDate = moment(startDate);
  var stopDate = moment(stopDate);
  while (currentDate <= stopDate) {
    console.log(`currentDate: ${currentDate} | stopDate: ${stopDate}`)
    dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
    currentDate = moment(currentDate).add(1, 'days');
  }
  return dateArray;
}

function convertToJsonl(providedStartDate, providedEndDate) {
  const datesToGetDataFor = getDates(providedStartDate, providedEndDate);
  const filesConvertedToJsonl = [];

  for (const dateItem of datesToGetDataFor) {
    dateFromFileName = padDateWithLeadingZeros(new Date(dateItem));
    const dataFileRead = JSON.parse(fs.readFileSync(`./data/ambient-weather-heiligers-data/${dateFromFileName}.json`));

    const openedDataForDailyFile = fs.openSync(`./data/ambient-weather-heiligers-jsonl/${dateFromFileName}.jsonl`, "w");

    const arrayOfConvertedData = dataFileRead.map((element, index) => {
      fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + '\n');
      fs.appendFileSync(openedDataForDailyFile, JSON.stringify(element) + '\n')
      return element;
    });
    if (arrayOfConvertedData && arrayOfConvertedData.length > 0) {
      filesConvertedToJsonl.push(dateItem);
    }
    fs.closeSync(openedDataForDailyFile);
  }
  if (filesConvertedToJsonl.length === datesToGetDataFor.length) {
    console.log(`converted files for ${datesToGetDataFor.length} files`)
  } else {
    console.log(`couldn't convert files for ${datesToGetDataFor.length - filesConvertedToJsonl.length} files`)
  }
}

return convertToJsonl('2020-05-03', '2020-06-11')
