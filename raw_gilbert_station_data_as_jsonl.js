const fs = require("file-system");
const moment = require("moment");
const path = require("path");
// const date = "08-06-2020";

function padDateWithLeadingZeros(date) {
  // console.log('date:', new Date(date))
  // console.log(new Date(date).getDate())
  date.setDate(date.getDate());
  return `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}${(
    "0" + date.getDate()
  ).slice(-2)}`;
}

// I want to replace having to give the dates for the files to convert with checking what has and hasn't been converted yet.
function getArrayOfFiles(pathToFolder) {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  let filesArray = [];
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
  // console.log('filesArrayInFunction', filesArray)
  return filesArray;
}

function convertToJsonl() {
  const allConvertedFiles = getArrayOfFiles(
    "ambient-weather-heiligers-data-jsonl"
  );
  const allRawFiles = getArrayOfFiles("ambient-weather-heiligers-data");
  const filesToConvert = allRawFiles.filter(
    (element) => allConvertedFiles.indexOf(element) === -1
  );

  let convertedCount = 0;
  const filesConvertedToJsonl = [];

  if (filesToConvert.length > 0) {
    filesToConvert.forEach((entry, index) => {
      const dataFileRead = JSON.parse(
        fs.readFileSync(`./data/ambient-weather-heiligers-data/${entry}.json`)
      );
      const openedDataForDailyFile = fs.openSync(
        `./data/ambient-weather-heiligers-data-jsonl/${entry}.jsonl`,
        "w"
      );
      const arrayOfConvertedData = dataFileRead.map((element, index) => {
        fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + "\n");
        fs.appendFileSync(
          openedDataForDailyFile,
          JSON.stringify(element) + "\n"
        );
        return element;
      });
      if (arrayOfConvertedData && arrayOfConvertedData.length > 0) {
        convertedCount = convertedCount + 1;
      }
      fs.closeSync(openedDataForDailyFile);
    });
  }
  if (convertedCount === filesToConvert.length) {
    console.log(`converted files for ${filesToConvert.length} files`);
  } else {
    console.log(
      `couldn't convert files for ${
        filesToConvert.length - convertedCount
      } files`
    );
  }
}
// note ATM, I have to provide tomorrow's date to convert the data in the file for today, for example.
return convertToJsonl();
