const fs = require('file-system');
const moment = require('moment')
// const date = "08-06-2020";

function padDateWithLeadingZeros(date) {
  // console.log('date:', new Date(date))
  // console.log(new Date(date).getDate())
  date.setDate(date.getDate());
  return `${date.getFullYear()}${('0' + (date.getMonth() + 1)).slice(-2)}${('0' + date.getDate()).slice(-2)}`;
}

function getDates(startDate, stopDate) {
  var dateArray = [];
  var currentDate = moment(startDate);
  var stopDate = moment(stopDate);
  while (currentDate <= stopDate) {
    dateArray.push(moment(currentDate).format('YYYY-MM-DD'))
    currentDate = moment(currentDate).add(1, 'days');
  }
  return dateArray;
}

function convertToJsonl() {
  const datesToGetDataFor = getDates('2020-05-03', '2020-06-12');
  const filesConvertedToJsonl = [];

  for (const dateItem of datesToGetDataFor) {
    dateFromFileName = padDateWithLeadingZeros(new Date(dateItem));
    const dataFileRead = JSON.parse(fs.readFileSync(`./data/raw_as_metric/${dateFromFileName}.json`));

    const openedDataForDailyFile = fs.openSync(`./data/jsonl/raw_as_metric_daily/${dateFromFileName}.jsonl`, "w");

    const arrayOfConvertedData = dataFileRead.map((element, index) => {
      const fixedElement = {
        ...element,
        feels_like_inside_c: element.feelslike_insideC,
        dewpoint_inside_c: element.dewpoint_insideC,
        wind_speed_meters_per_second: element.windspeed_mps,
        wind_gust_meters_per_second: element.windgust_mps
      }
      fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + '\n');
      fs.appendFileSync(openedDataForDailyFile, JSON.stringify(fixedElement) + '\n')
      return fixedElement;
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

return convertToJsonl()
