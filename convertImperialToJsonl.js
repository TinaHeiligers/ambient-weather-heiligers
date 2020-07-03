// -----------------------------------------
// converting imperial raw to jsonl: THIS THROWS AN ERROR but it does work
// -----------------------------------------
const convertRawImperialDataToJsonl = require('./ambient-weather-heiligers-imperial_as_jsonl');
const convertImperialToJsonl = convertRawImperialDataToJsonl();
module.exports = convertImperialToJsonl;
