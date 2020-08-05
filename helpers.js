const cu = require("convert-units");
const momentTZ = require("moment-timezone");

const convertTemp = function (f) {
  const tempInC = cu(f).from("F").to("C");
  return Number(tempInC.toFixed(3));
};

const convertMPH = function (mph) {
  const speedmph = cu(mph).from("m/h").to("m/s");
  return Number(speedmph.toFixed(3));
};

const calcMinutesDiff = (to, from) => {
  return momentTZ.duration(momentTZ(to).diff(momentTZ(from))).as("minutes");
};

module.exports = {
  convertTemp,
  convertMPH,
  calcMinutesDiff
};
