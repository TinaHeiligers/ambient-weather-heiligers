const main = require('./main');

module.exports = (async () => {
  try {
    var result = await main();
    console.log('[runMainIIFE] [RESULT]:', result);
  } catch (err) {
    // I'll want to log these results rather than throw.
    console.error('[runMainIIFE] [ERROR]', err)
    throw err;
  }
})()
