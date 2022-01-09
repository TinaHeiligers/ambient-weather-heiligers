// Reads json form of imperial data from file
// Converts from imperial to metric units
const momentTZ = require("moment-timezone");
const { convertToMetric } = require('../utils');
// Writes the metric data directly to jsonl files
class ConvertImperialToMetric {
  #pathToMetricJsonlFiles = 'ambient-weather-heiligers-metric-jsonl'; // jsonl form of metric data already converted
  #pathToImperialDataFiles = 'ambient-weather-heiligers-imperial'; // raw imperial data in json form
  #allMetricJsonlfilesArray = [];
  #convertedToMetricCount = 0;
  #dataFilesConvertedToMetricJsonl = [];
  #now = momentTZ.utc(momentTZ());
  constructor(fs) {
    this.fs = fs;
  }
  get now() {
    return this.#now;
  }
  set now(date) {
    this.#now = date;
  }
  get pathToMetricJsonlFiles() {
    return this.#pathToMetricJsonlFiles;
  }
  get pathToImperialDataFiles() {
    return this.#pathToImperialDataFiles;
  }
  get allMetricJsonlFilesArray() {
    return this.#allMetricJsonlfilesArray;
  }
  set allMetricJsonlFilesArray(array) {
    this.#allMetricJsonlfilesArray = array;
  }
  get dataFilesConvertedToMetricJsonl() {
    return this.#dataFilesConvertedToMetricJsonl;
  }
  set dataFilesConvertedToMetricJsonl(array) {
    this.#dataFilesConvertedToMetricJsonl = array;
  }
  get convertedToMetricCount() {
    return this.#convertedToMetricCount
  }
  set convertedToMetricCount(num) {
    this.#convertedToMetricCount = num;
  }

  getArrayOfFiles(filetype) {
    const fullPath = filetype === 'json' ? this.pathToImperialDataFiles : this.pathToMetricJsonlFiles;
    const directoryPath = `data/${fullPath}`;
    const files = this.fs.readdirSync(directoryPath);
    let filesArray = [];// an array of filenames without the extension type: string[] | []
    files.forEach((file) => filesArray.push(`${file}`.split(".")[0]));
    return filesArray;
  }

  convertDataAndWriteJsonlFile(filesToConvert) {
    filesToConvert.forEach((file) => {
      // skip an file if it doesn't contain values
      if (Object.keys(file).length === 0) return true;
      // read and parse the imperial data from json format
      const dataFileRead = JSON.parse(this.fs.readFileSync(`data/${this.pathToImperialDataFiles}/${file}.json`));
      // open a sync to a new file to write the metric data to
      const openedDataForMetricJsonlFile = this.fs.openSync(`data/${this.pathToMetricJsonlFiles}/${file}.jsonl`, "w");
      // map over the entries in the imperial json file
      const arrayOfConvertedData = dataFileRead.map((datum) => {
        // convert to metric
        const convertedDatum = convertToMetric(datum);
        // write the converted element as a new line in the new file that will contain the metric data as a one-line json body
        this.fs.appendFileSync(openedDataForMetricJsonlFile, JSON.stringify(convertedDatum) + "\n")
        this.dataFilesConvertedToMetricJsonl = this.dataFilesConvertedToMetricJsonl.concat(file);
        return datum;
      });
      // check that we're done, increment the counter and close the fileSync
      if (arrayOfConvertedData && arrayOfConvertedData.length > 0) {
        this.convertedToMetricCount = this.convertedToMetricCount + 1;
      };
      this.fs.closeSync(openedDataForMetricJsonlFile)
    });
    return true;
  }

  logResult(filesToConvert) {
    if (this.convertedToMetricCount === filesToConvert.length) {
      console.log(`converted metric data files for ${filesToConvert.length} files: ${filesToConvert}`);
    } else {
      console.log(`couldn't convert metric data files for ${filesToConvert.length - this.convertedToMetricCount} files`);
    }
  }

  // Main function that gets executed.
  convertImperialDataToMetricJsonl() {
    // fetch converted and unconverted file names without the .json/.jsonl;
    console.log(`Converting imperial to metric data`)
    const allMetricJsonlFileNames = this.getArrayOfFiles('jsonl');
    const allImperialFileNames = this.getArrayOfFiles('json');
    // filter out the files that have already been converted
    const fileNamesToConvertToMetric = allImperialFileNames.filter((fileName) => allMetricJsonlFileNames.indexOf(fileName) === -1);

    // read and write the file contents as newline delimited data
    if (fileNamesToConvertToMetric.length > 0) {
      this.convertDataAndWriteJsonlFile(fileNamesToConvertToMetric);
      this.logResult(fileNamesToConvertToMetric);
    } else {
      console.log('There are no unconverted files')
    }
    // this.dataFilesConvertedToMetricJsonl = fileNamesToConvertToMetric;
    return fileNamesToConvertToMetric;
  }
}

module.exports = ConvertImperialToMetric;
