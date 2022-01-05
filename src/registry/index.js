const Registry = require('./savedDataFilenamesRegistry');

const testRegistry = new Registry(fs = require('file-system'))
const result = testRegistry.run();
console.log('result:', result);
module.exports = result;
