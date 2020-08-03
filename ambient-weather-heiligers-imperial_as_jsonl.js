/* TODO: for testing, fs methods used are:
  readdirSync
  readFileSync
  writeSync
  appendFileSync
  closeSync
*/

class ConvertImperialToJsonl {
  #pathToJsonlFiles = 'ambient-weather-heiligers-imperial-jsonl';
  #pathToJsonFiles = 'ambient-weather-heiligers-imperial';
  #allJsonfilesArray = [];
  #convertedCount = 0;
  #filesConvertedToJsonl = [];
  constructor(fs, path) {
    this.fs = fs;
    this.path = path;
  }
  get pathToJsonlFiles() {
    return this.#pathToJsonlFiles;
  }
  get pathToJsonFiles() {
    return this.#pathToJsonFiles;
  }
  get allJsonFilesArray() {
    return this.#allJsonfilesArray;
  }
  set allJsonFilesArray(array) {
    this.#allJsonfilesArray = array;
  }
  get filesConvertedToJsonl() {
    return this.#filesConvertedToJsonl;
  }
  set filesConvertedToJsonl(array) {
    this.#filesConvertedToJsonl = array;
  }
  get convertedCount() {
    return this.#convertedCount
  }
  set convertedCount(num) {
    this.#convertedCount = num;
  }

  getArrayOfFiles(filetype) {
    const fullPath = filetype === 'json' ? this.#pathToJsonFiles : this.#pathToJsonlFiles;
    const directoryPath = this.path.join(__dirname, `data/${fullPath}`);
    const files = this.fs.readdirSync(directoryPath);
    let filesArray = [];
    files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
    return filesArray;
  }
  convertRawImperialDataToJsonl() {
    // fetch converted and unconverted file names without the .json/.jsonl;
    const allConvertedFiles = this.getArrayOfFiles('jsonl');
    const allRawFiles = this.getArrayOfFiles('json');
    // filter out the files that have already been converted
    const filesToConvert = allRawFiles.filter((element) => allConvertedFiles.indexOf(element) === -1);
    console.log('3. filesToConvert', filesToConvert)
    // read and write the file contents as newline delimited data
    if (filesToConvert.length > 0) {
      filesToConvert.forEach((entry) => {
        const dataFileRead = JSON.parse(
          this.fs.readFileSync(`./data/${this.pathToJsonFiles}/${entry}.json`)
        );
        const openedDataForJsonlFile = this.fs.openSync(
          `./data/${this.pathToJsonlFiles}/${entry}.jsonl`,
          "w"
        );
        this.arrayOfConvertedData = dataFileRead.map((element) => {
          this.fs.appendFileSync(openedDataForJsonlFile, JSON.stringify(element) + "\n")
          this.filesConvertedToJsonl = this.filesConvertedToJsonl.concat(entry);
          return element;
        });
        // check that we're done, increment the counter and close the fileSync
        if (this.arrayOfConvertedData && this.arrayOfConvertedData.length > 0) {
          this.convertedCount = this.convertedCount + 1;
        };
        this.fs.closeSync(openedDataForJsonlFile)
      });
    }
    // do another check, mostly for logging purposes
    if (this.convertedCount === filesToConvert.length) {
      console.log(`converted files for ${filesToConvert.length} files, ${filesToConvert}`);
    } else {
      console.log(
        `couldn't convert files for ${
        filesToConvert.length - this.convertedCount
        } files`
      );
    }
    return this.filesConvertedToJsonl;
  }
}

module.exports = ConvertImperialToJsonl;

// function getArrayOfFiles(pathToFolder, fs, path) {
//   const directoryPath = path.join(__dirname, `data/${pathToFolder}`);
//   let filesArray = [];
//   const files = fs.readdirSync(directoryPath);
//   files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
//   return filesArray;
// }

// function convertRawImperialDataToJsonl(fs, path) {
//   const allConvertedFiles = getArrayOfFiles(
//     "ambient-weather-heiligers-imperial-jsonl", fs, path
//   );
//   const allRawFiles = getArrayOfFiles("ambient-weather-heiligers-imperial", fs);
//   const filesToConvert = allRawFiles.filter(
//     (element) => allConvertedFiles.indexOf(element) === -1
//   );

//   let convertedCount = 0;
//   const filesConvertedToJsonl = [];

//   if (filesToConvert.length > 0) {
//     filesToConvert.forEach((entry, index) => {
//       const dataFileRead = JSON.parse(
//         fs.readFileSync(`./data/ambient-weather-heiligers-imperial/${entry}.json`)
//       );
//       const openedDataForDailyFile = fs.openSync(
//         `./data/ambient-weather-heiligers-imperial-jsonl/${entry}.jsonl`,
//         "w"
//       );
//       const arrayOfConvertedData = dataFileRead.map((element, index) => {
//         fs.appendFileSync(
//           openedDataForDailyFile,
//           JSON.stringify(element) + "\n"
//         );
//         filesConvertedToJsonl.push(entry);
//         return element;
//       });
//       if (arrayOfConvertedData && arrayOfConvertedData.length > 0) {
//         convertedCount = convertedCount + 1;
//       }
//       fs.closeSync(openedDataForDailyFile);
//     });
//   }
//   if (convertedCount === filesToConvert.length) {
//     console.log(`converted files for ${filesToConvert.length} files, ${filesToConvert}`);
//   } else {
//     console.log(
//       `couldn't convert files for ${
//       filesToConvert.length - convertedCount
//       } files`
//     );
//   }
//   return filesConvertedToJsonl;
// }
// // note ATM, I have to provide tomorrow's date to convert the data in the file for today, for example.
// // return convertRawImperialDataToJsonl();
// module.exports = convertRawImperialDataToJsonl;
