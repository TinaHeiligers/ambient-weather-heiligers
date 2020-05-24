const fs = require('file-system')
const dataFileRead = JSON.parse(fs.readFileSync(`./data/test/24-05-2020.json`));

// const openedDataForDailyFile = fs.openSync(`./data/daily_data_${year}.jsonl`, "w");
const openedDataForDailyFile = fs.openSync(`./data/jsonl/all.jsonl`, "a");

const arrayOfConvertedData = dataFileRead.map((element, index) => {
  // fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + '\n');
  fs.appendFileSync(openedDataForDailyFile, JSON.stringify(element) + '\n')
  return element;
});

fs.closeSync(openedDataForDailyFile);

