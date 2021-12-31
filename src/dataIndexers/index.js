const client = require('./esClient');

const testClientConnection = async function () {
  let result;
  console.log('starting the search')
  try {
    result = await client.search({
      index: 'ambient_weather_heiligers_metric*',
      body: {
        query: {
          match_all: {}
        }
      }
    });
  } catch (err) {
    console.log('oops', err);
  }
  console.log('result?', result.body.hits.hits[1])
  return result;
}

testClientConnection();

