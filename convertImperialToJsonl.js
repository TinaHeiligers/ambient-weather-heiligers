// -----------------------------------------
// converting imperial raw to jsonl: THIS THROWS AN ERROR but it does work
// -----------------------------------------
const fs = require('file-system');
const convertRawImperialDataToJsonl = require('./Ambient-weather-heiligers-imperial_as_jsonl');
const convertImperialToJsonl = convertRawImperialDataToJsonl(fs);
module.exports = convertImperialToJsonl;
