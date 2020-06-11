const fs = require('file-system');
// const date = "08-06-2020";
const dates = ["09-06-2020", "10-06-2020", "11-06-2020"]

dates.forEach(date => {
  const dataFileRead = JSON.parse(fs.readFileSync(`./data/test/${date}.json`));

  const openedDataForDailyFile = fs.openSync(`./data/jsonl/daily/${date}.jsonl`, "w");

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

  fs.closeSync(openedDataForDailyFile);
})




