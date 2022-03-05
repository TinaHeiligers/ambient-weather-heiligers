const addToArray = (arrayToAddTo, itemToAdd) => {
  return Array.isArray(itemToAdd) ? arrayToAddTo.concat(itemToAdd) : arrayToAddTo.concat([itemToAdd]);
};

class Registry {
  #allFileNames = [];
  #readAllFileNames = [];
  #todoAllFileNames = [];
  constructor(fs) {
    this.fs = fs;
  }
  get allFileNames() {
    return this.#allFileNames
  };
  set allFileNames(files) {
    this.#allFileNames = addToArray(this.#allFileNames, files)
  }
  get readAllFileNames() {
    return this.#readAllFileNames;
  }
  set readAllFileNames(names) {
    this.#readAllFileNames = addToArray(this.#readAllFileNames, names)
  }
  get todoAllFileNames() {
    return this.#todoAllFileNames;
  }
  set todoAllFileNames(names) {
    this.#todoAllFileNames = this.allFileNames.filter(name => this.readAllFileNames.indexOf(name) === -1);
  }

  retrieveAllFileNames(pathToFolder = 'ambient-weather-heiligers-imperial') {
    const directoryPath = `data/${pathToFolder}`;
    const files = this.fs.readdirSync(directoryPath);
    this.allFileNames = files;
    return this.allFileNames;
  }

  retrieveFileNamesForCount(count = 10, year = '2022') {
    const filesForYear = this.allFileNames.filter(fileName => fileName.split('-T-')[0].startsWith(year));
    return filesForYear.filter((entry, index) => index < count);
  }

  run = () => {
    this.retrieveAllFileNames();
    const requiredStuff = this.retrieveFileNamesForCount(10, '2021')
    return requiredStuff;
  }
}

module.exports = Registry
