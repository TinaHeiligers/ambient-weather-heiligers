const fs = require('file-system');
const { ConvertImperialToJsonl } = require('./src/converters');
const imperialToJsonlConverter = new ConvertImperialToJsonl(fs);
const convertedData = imperialToJsonlConverter.convertRawImperialDataToJsonl();
module.exports = convertedData;
