class Logger {
  constructor(name) {
    this.name = name;
  }

  logMessage(message, meta = {}) {
    console.log(`${this.name}:`, message, meta)
  };

  logError(error, meta = {}) {
    console.error(`${this.name}:`, error, meta)
  };

  logInfo(info, meta = {}) {
    console.log(`${this.name}:`, info, meta)
  };

  logWarning(warning, meta = {}) {
    console.warn(`${this.name}:`, warning, meta)
  };
}
module.exports = Logger;
