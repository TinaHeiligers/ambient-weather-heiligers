// -----------------------------------------
// converting imperial raw to jsonl: THIS THROWS AN ERROR but it does work
// -----------------------------------------
const fs = require('file-system');
const path = require('path')
const ConvertImperialToJsonl = require('./ambient-weather-heiligers-imperial_as_jsonl');
const imperialToJsonlConverter = new ConvertImperialToJsonl(fs, path);
const convertedData = imperialToJsonlConverter.convertRawImperialDataToJsonl();
module.exports = convertedData;
