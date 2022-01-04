const esClient = require('./esClient');
const { indexDoesNotExist, indexExistsError } = require('./errors');
const { errors } = require('@elastic/elasticsearch');
const Logger = require('../logger');

const cclogger = new Logger('cclogger');
// gets the current cluster info
/**
 *
 * @param {Class} client configured elasticsearch client
 * @returns cluster information
 */
const getClusterInfo = async function (client = esClient) {
  let result;
  try {
    result = await esClient.info();
  } catch (err) {
    cclogger.logWarning('oops', err);
  }
  cclogger.logInfo('clusterInfo:', result)
  return result;
}

/**
 *
 * @param {Class} client: configured elasticsearch client
 * @returns boolean: true if there is a connection, false otherwise
 */
async function pingCluster(client = esClient) {
  let pingResult;
  try {
    pingResult = await esClient.ping();
  } catch (err) {
    cclogger.logError(err);
  }
  return pingResult.body;
}

/**
 *
 * @param {Class} client: configured Elasticsearch client
 * @returns array of ambient_weather_heiligers_* indices (see getAllAmbientWeatherIndicesResult in ./exampleAPICallResponses)
 */

const getAllAmbientWeatherIndices = async function (client = require('./esClient')) {
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
    cclogger.logError(err)
  }
  cclogger.logInfo('clusterIndices', clusterIndices.body);
  return clusterIndices.body;
}
/**
 *
 * @param {class} client: configured elasticsearch client
 * @returns array of objects containing { alias <string>, index <string>, is_write_index: <boolean> }
 * @example
 * [{
*   alias: 'all-ambient-weather-heiligers-imperial',
*   index: 'ambient_weather_heiligers_imperial_2021_06_12',
*   is_write_index: 'false'
*  }]
 */
const getAmbientWeatherAliases = async function (client = require('./esClient')) {
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
    cclogger.logError(err)
  }
  cclogger.logInfo("clusterAliasesResult:", clusterAliasesResult)
  return clusterAliasesResult; // returns body, statusCode, headers, meta
}
/* params:
* esClient = elastisearch client already configured
* indexName <string>, name of the index to create
* indexMappings <Object> mappings for the index
* returns:
*/
/**
 *
 * @param {Class} client elastisearch client already configured
 * @param {string} indexName
 * @param {object} indexMappings
 * @returns {object} { body, statusCode, headers, meta } where body is { acknowledged: <boolean>, shards_acknowledged: <boolean>, index: <string> }
 * @example see ./exampleAPICallResponses.js for more info
    body: { acknowledged: true, shards_acknowledged: true, index: 'tweets' },
    statusCode: 200,
    headers: {..., date: 'Tue, 04 Jan 2022 21:23:29 GMT'},
    meta: {...}
 */
const createIndex = async function (client = require('./esClient'), indexName, indexMappings) {
  let createIndexResult;
  try {
    createIndexResult = await client.indices.create({
      index: indexName,
      body: {
        mappings: indexMappings
      }
    }, { ignore: [404] });
  } catch (err) {
    if (!indexExistsError(err)) {
      cclogger.logError(`cannot create the index: ${indexName}`, err)
      throw err;
    } else {
      cclogger.logWarning(`index ${indexName} already exists`, err)
    }
  }
  cclogger.logInfo('createIndexResult:', createIndexResult);
  return createIndexResult;
}

// params: esClient = elasticsearch client preconfigured, indexName <string>: name of the index to delete
/**
 *
 * @param {Class} client configured elasticsearch client
 * @param {string} indexName
 * @returns {object} body of es response
 * @example { acknowledged: true }
 */
const deleteIndex = async function (client = require('./esClient'), indexName) {
  let deleteResult;
  const deleteIndexDefaultArgs = {
    timeout: '30s',
    master_timeout: '30s',
    ignore_unavailable: false,
    allow_no_indices: false,
    expand_wildcards: 'open,closed'
  }
  try {
    deleteResult = await esClient.indices.delete({
      index: indexName,
      ...deleteIndexDefaultArgs,
    })
  } catch (err) {
    if (indexDoesNotExist(err)) {
      cclogger.logInfo('index does not exist', err)
    } else {
      cclogger.logError(err)
      throw new Error('unhandled exception error from deleteIndex', err)
    }
  }
  cclogger.logInfo(`deleteResult: ${deleteResult}`)
  return deleteResult.body;
}
// given the configured elasticsearch client, data to index and the target index, bulk indexes data
// returns
const bulkIndexData = async function (client = require('./esClient'), data = [], dataType) {
  // do stuff
}



const clientMethods = {
  getClusterInfo,
  pingCluster,
  getAllAmbientWeatherIndices,
  getAmbientWeatherAliases,
  createIndex,
  deleteIndex
}
// clientMethods.getClusterInfo();
// clientMethods.pingCluster();
// clientMethods.getAllAmbientWeatherIndices();
// clientMethods.getClusterIndices();
// clientMethods.getAmbientWeatherAliases();
// clientMethods.getAmbientWeatherAliases();
const testMappings = {
  properties: {
    id: { type: 'integer' },
    text: { type: 'text' },
    user: { type: 'keyword' },
    time: { type: 'date' }
  }
}
// clientMethods.createIndex(require('./esClient'), 'tweets', testMappings)
// clientMethods.deleteIndex(require('./esClient'), 'tweets')
module.exports = { pingCluster, getAmbientWeatherAliases, createIndex };


