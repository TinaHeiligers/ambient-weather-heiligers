const FetchRawData = require('./FetchRawData');
const fetchRawDataTester = new FetchRawData();
const newData = fetchRawDataTester.getDataForDateRanges();

module.exports = newData;
