class Logger {
  constructor(name) {
    this.name = name;
  };

  logMessage(message, meta = null) {
    !!meta ? console.log(`${this.name}:`, message, meta) : console.log(`${this.name}:`, message)

  };

  logError(error, meta) {
    !!meta ? console.error(`${this.name}:`, error, meta) : console.error(`${this.name}:`, error)
  };

  logInfo(info, meta) {
    !!meta ? console.log(`${this.name}:`, info, meta) : console.log(`${this.name}:`, info)
  };

  logWarning(warning, meta) {
    !!meta ? console.warn(`${this.name}:`, warning, meta) : console.warn(`${this.name}:`, warning)
  };
}
module.exports = Logger;
