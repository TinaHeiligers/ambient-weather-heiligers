const fs = require('file-system');
const path = require('path')
const ConvertImperialToJsonl = require('./src/converters');
const imperialToJsonlConverter = new ConvertImperialToJsonl(fs, path);
const convertedData = imperialToJsonlConverter.convertRawImperialDataToJsonl();
module.exports = convertedData;
