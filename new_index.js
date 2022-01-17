const main = require('./main');

module.exports = (async () => {
  try {
    var result = await main();
    console.log(result);
  } catch (err) {
    // I'll want to log these results rather than throw.
    throw err;
  }
})()
