const fs = require("file-system");
const moment = require("moment");
const path = require("path");
// const date = "08-06-2020";

// I want to replace having to give the dates for the files to convert with checking what has and hasn't been converted yet.
function getArrayOfFiles(pathToFolder) {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  let filesArray = [];
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
  // console.log('filesArrayInFunction', filesArray)
  return filesArray;
}

function compareFileArrays(jsonFiles, jsonlFiles) {
  return jsonFiles.filter((element) => jsonlFiles.indexOf(element) === -1);
}

function convertToJsonl() {
  const allConvertedFiles = getArrayOfFiles(
    "ambient-weather-heiligers-data-metric-jsonl"
  );
  const allRawFiles = getArrayOfFiles("ambient-weather-heiligers-data-metric");
  const filesToConvert = compareFileArrays(allRawFiles, allConvertedFiles);

  let convertedCount = 0;
  const filesConvertedToJsonl = [];

  if (filesToConvert.length > 0) {
    filesToConvert.forEach((entry, index) => {
      console.log("entry:", entry);
      const dataFileRead = JSON.parse(
        fs.readFileSync(
          `./data/ambient-weather-heiligers-data-metric/${entry}.json`
        )
      );
      const openedDataForDailyFile = fs.openSync(
        `./data/ambient-weather-heiligers-data-metric-jsonl/${entry}.jsonl`,
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
        filesConvertedToJsonl.push(entry);
      }
      fs.closeSync(openedDataForDailyFile);
      return entry;
    });
  }
  if (convertedCount === filesToConvert.length) {
    console.log(`converted files for ${convertedCount} files`);
  } else {
    const todos = compareFileArrays(filesToConvert, filesConvertedToJsonl);
    console.log(`couldn't convert files for ${todos.length} files: ${todos}`);
  }
}
// note ATM, I have to provide tomorrow's date to convert the data in the file for today, for example.
return convertToJsonl();
