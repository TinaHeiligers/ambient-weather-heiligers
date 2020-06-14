const cu = require('convert-units');

module.exports.convertTemp = function (f) {
  const tempInC = cu(f).from('F').to('C');
  return Number((tempInC).toFixed(3));
}

module.exports.convertMPH = function (mph) {
  const speedmph = cu(mph).from('m/h').to('m/s');
  return Number((speedmph).toFixed(3));
}
