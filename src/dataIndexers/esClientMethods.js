const esClient = require('./esClient');
// gets the current cluster info
const getClusterInfo = async function (client = esClient) {
  let result;
  try {
    result = await esClient.info();
  } catch (err) {
    console.log('oops', err);
  }
  console.log('clusterInfo:', result)
  return result;
}

// params: elasticsearch client initialized with cluster id and auth (username, password) from env
// returns: boolean
async function pingCluster(client = esClient) {
  let pingResult;
  try {
    pingResult = await esClient.ping();
  } catch (err) {
    console.error(err);
  }
  return pingResult.body;
}

const getClusterIndices = async function (client = esClient) {
  let clusterIndices;
  try {
    clusterIndices = await esClient.cat.indices({
      index: 'ambient_weather_heiligers_*',
      'format': 'json',
      bytes: 'kb',
      v: true,
      expand_wildcards: 'all',
    });
  } catch (err) {
    console.error(err)
  }
  console.log('clusterIndices', clusterIndices)
  return clusterIndices;
}

const getClusterAliases = async function (client = esClient) {
  let clusterAliasesResult;
  let error;
  try {
    const { body, statusCode, headers, meta } = await esClient.cat.aliases({
      name: '*ambient-weather-heiligers-*',
      format: 'json',
      h: ['alias', 'index', 'is_write_index'],
      v: true,
      expand_wildcards: 'all'
    });
    if (statusCode === 200) {
      clusterAliasesResult = body;
    } else {
      error = new Error(`Problem with getting the cluster aliases with code ${statusCode}`)
    }
  } catch (err) {
    error = err;
    console.error(err)
  }
  return clusterAliasesResult; // returns body, statusCode, headers, meta
}

const getActiveWriteIndices = async function (client = esClient) {
  let currentIndices;
  let activeIndices = { metric: '', imperial: '' };
  const aliasesResults = await getClusterAliases();
  currentIndices = aliasesResults.filter(aliasEntry => (aliasEntry.is_write_index === 'true'))
  console.log('currentIndices', currentIndices)
  return currentIndices;
}

const clientMethods = {
  clusterInfo: getClusterInfo,
  clusterPing: pingCluster,
  catIndices: getClusterIndices,
  catAliases: getClusterAliases,
  activeIndices: getActiveWriteIndices
}
// clientMethods.clusterInfo()
// clientMethods.catIndices()
// clientMethods.catAliases()
// clientMethods.activeIndices();
module.exports = { pingCluster };


