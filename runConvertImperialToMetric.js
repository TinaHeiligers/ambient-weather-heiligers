const fs = require('file-system');
const { ConvertImperialToMetric } = require('./src/converters');
const imperialToMetricJsonlConverter = new ConvertImperialToMetric(fs);
const convertedMetricData = imperialToMetricJsonlConverter.convertImperialDataToMetricJsonl();
module.exports = convertedMetricData;
