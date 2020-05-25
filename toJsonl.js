const fs = require('file-system');
const date = "18-05-2020";
const dates = ["17-05-2020", "16-05-2020", "15-05-2020", "14-05-2020", "13-05-2020", "12-05-2020", "11-05-2020", "10-05-2020", "09-05-2020", "08-05-2020", "07-05-2020", "06-05-2020", "05-05-2020", "04-05-2020", "03-05-2020"]

dates.forEach(date => {
  const dataFileRead = JSON.parse(fs.readFileSync(`./data/test/${date}.json`));

  // const openedDataForDailyFile = fs.openSync(`./data/daily_data_${year}.jsonl`, "w");
  const openedDataForDailyFile = fs.openSync(`./data/jsonl/daily/${date}.jsonl`, "w");

  const arrayOfConvertedData = dataFileRead.map((element, index) => {
    const fixedElement = {
      ...element,
      feels_like_inside_c: element.feelslike_insideC,
      dewpoint_inside_c: element.dewpoint_insideC,
      wind_speed_meters_per_second: element.windspeed_mps,
      wind_gust_meters_per_second: element.windgust_mps
    }
    // fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + '\n');
    fs.appendFileSync(openedDataForDailyFile, JSON.stringify(fixedElement) + '\n')
    return fixedElement;
  });

  fs.closeSync(openedDataForDailyFile);
})




