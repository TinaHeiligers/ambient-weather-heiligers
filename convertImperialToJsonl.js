/* TODO: for testing, fs methods used are:
  readdirSync
  readFileSync
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
  convertFiles(filesToConvert) {
    filesToConvert.forEach((entry) => {
      const dataFileRead = JSON.parse(this.fs.readFileSync(`./data/${this.pathToJsonFiles}/${entry}.json`));
      const openedDataForJsonlFile = this.fs.openSync(`./data/${this.pathToJsonlFiles}/${entry}.jsonl`, "w");
      const arrayOfConvertedData = dataFileRead.map((element) => {
        this.fs.appendFileSync(openedDataForJsonlFile, JSON.stringify(element) + "\n")
        this.filesConvertedToJsonl = this.filesConvertedToJsonl.concat(entry);
        return element;
      });
      // check that we're done, increment the counter and close the fileSync
      if (arrayOfConvertedData && arrayOfConvertedData.length > 0) {
        this.convertedCount = this.convertedCount + 1;
      };
      this.fs.closeSync(openedDataForJsonlFile)
    });
  }
  updateStatus(filesToConvert) {
    if (this.convertedCount === filesToConvert.length) {
      console.log(`converted files for ${filesToConvert.length} files: ${filesToConvert}`);
    } else {
      console.log(`couldn't convert files for ${filesToConvert.length - this.convertedCount} files`);
    }
  }
  convertRawImperialDataToJsonl() {
    // fetch converted and unconverted file names without the .json/.jsonl;
    const allConvertedFiles = this.getArrayOfFiles('jsonl');
    const allRawFiles = this.getArrayOfFiles('json');
    // filter out the files that have already been converted
    const filesToConvert = allRawFiles.filter((element) => allConvertedFiles.indexOf(element) === -1);
    // read and write the file contents as newline delimited data
    if (filesToConvert.length > 0) {
      this.convertFiles(filesToConvert);
      this.updateStatus(filesToConvert);
    } else {
      console.log('There are no unconverted files')
    }
    return this.filesConvertedToJsonl;
  }
}

module.exports = ConvertImperialToJsonl;
