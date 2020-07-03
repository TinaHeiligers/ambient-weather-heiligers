const fs = require("file-system");
const path = require("path");

function getArrayOfFiles(pathToFolder) {
  const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
  let filesArray = [];
  const files = fs.readdirSync(directoryPath);
  files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
  return filesArray;
}

function convertRawImperialDataToJsonl() {
  const allConvertedFiles = getArrayOfFiles(
    "ambient-weather-heiligers-imperial-jsonl"
  );
  const allRawFiles = getArrayOfFiles("ambient-weather-heiligers-imperial");
  const filesToConvert = allRawFiles.filter(
    (element) => allConvertedFiles.indexOf(element) === -1
  );

  let convertedCount = 0;
  const filesConvertedToJsonl = [];

  if (filesToConvert.length > 0) {
    filesToConvert.forEach((entry, index) => {
      const dataFileRead = JSON.parse(
        fs.readFileSync(`./data/ambient-weather-heiligers-imperial/${entry}.json`)
      );
      const openedDataForDailyFile = fs.openSync(
        `./data/ambient-weather-heiligers-imperial-jsonl/${entry}.jsonl`,
        "w"
      );
      const arrayOfConvertedData = dataFileRead.map((element, index) => {
        fs.writeSync(openedDataForDailyFile, JSON.stringify(element) + "\n");
        fs.appendFileSync(
          openedDataForDailyFile,
          JSON.stringify(element) + "\n"
        );
        filesConvertedToJsonl.push(entry);
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
  return filesConvertedToJsonl;
}
// note ATM, I have to provide tomorrow's date to convert the data in the file for today, for example.
// return convertRawImperialDataToJsonl();
module.exports = convertRawImperialDataToJsonl;
