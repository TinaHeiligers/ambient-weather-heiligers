const esClient = require('./esClient');
const { indexDoesNotExist, indexExistsError } = require('./errors');
const { errors } = require('@elastic/elasticsearch');
const Logger = require('../logger');

const esClientLogger = new Logger('esClientLogger');

// gets the current cluster info
/**
 *
 * @param {Class} client configured elasticsearch client
 * @returns cluster information
 */
async function getClusterInfo(client = esClient) {
  let result;
  try {
    result = await esClient.info();
  } catch (err) {
    esClientLogger.logError('[getClusterInfo] [ERROR]', err);
  }
  esClientLogger.logInfo('[getClusterInfo] [SUCCESS]', result)
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
    esClientLogger.logError('[pingCluster] [ERROR]', err);
  }
  return pingResult.body;
}

/**
 *
 * @param {Class} client: configured Elasticsearch client
 * @returns array of ambient_weather_heiligers_* indices (see getAllAmbientWeatherIndicesResult in ./exampleAPICallResponses)
 */

async function getAllAmbientWeatherIndices(client = require('./esClient')) {
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
    esClientLogger.logError('[getAllAmbientWeatherIndices] [ERROR]', err)
  }
  esClientLogger.logInfo('[getAllAmbientWeatherIndices] [SUCCESS]', clusterIndices.body);
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
async function getAmbientWeatherAliases(client = require('./esClient')) {
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
    esClientLogger.logError('[getAmbientWeatherAliases] [ERROR]', err)
  }
  esClientLogger.logInfo('[getAmbientWeatherAliases] [SUCCESS]', clusterAliasesResult)
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
async function createIndex(client = require('./esClient'), indexName, indexMappings) {
  let createIndexResult;
  try {
    createIndexResult = await client.indices.create({
      index: indexName,
      body: {
        mappings: indexMappings
      }
    }, { ignore: [400] }); // explicitly ignore 400, not 404. see https://github.com/elastic/elasticsearch-js/pull/927/files
  } catch (err) {
    if (!indexExistsError(err)) {
      esClientLogger.logError(`[createIndex] [ERROR] cannot create the index: ${indexName}`, err)
      throw err;
    } else {
      esClientLogger.logWarning(`[createIndex] [WARNING] index ${indexName} already exists`, err)
    }
  }
  esClientLogger.logInfo('[createIndex] [SUCCESS]', createIndexResult);
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
async function deleteIndex(client = require('./esClient'), indexName) {
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
      esClientLogger.logInfo('[deleteIndex] [INFO] index does not exist', err)
    } else {
      esClientLogger.logError('[deleteIndex] [ERROR]', err)
      throw new Error('unhandled exception error from deleteIndex', err)
    }
  }
  esClientLogger.logInfo('[deleteIndex] [SUCCESS]', deleteResult)
  return deleteResult.body;
}

async function getMostRecentDoc(client = require('./esClient'), indexName, opts) {
  // esClientLogger.logInfo('indexName', indexName)
  if (opts && opts.sort && opts.sort.length > 0) {
    opts.sortReq = opts.sortBy.map((entry) => `${entry.field}:${entry.direction ?? 'asc'}`).join(',')
  }

  const searchConfig = {
    expand_wildcards: opts.expandWildcards ?? 'all', // for using wildcard expressions
    sort: opts.sortReq ?? ["dateutc:desc"], // default sort order is descending with the most recent doc first
    size: opts.size || 10,
    _source: opts._source ?? []
  };

  let searchResultBody;
  try {
    const { body, headers, statusCode, meta } = await client.search({
      ...searchConfig,
      index: indexName,
      body: {
        query: {
          match_all: {}
        }
      }
    });
    searchResultBody = body.hits.hits;
    // esClientLogger.logInfo('result of search request:', searchResultBody)
  } catch (err) {
    esClientLogger.logError('search request error:', err)
  }
  return searchResultBody;
  //implement me using esClient.search with decending order and retrieving only 1 doc.
}
/**
 *
 * @param {elasticsearch client} client
 * @param {string} indexName index to target and return counts from after bulk request is issued.
 * @param {array} payload preconfigured bulk payload
 * @param {obj} opts option bulk request options to pass to ES
 * @returns { obj } { indexCounts: <number> total number of documents in the target index, erroredDocuments: <array> documents that had an error with bulk operation}
 */

async function bulkIndexDocuments(client = require('./esClient'), indexName, payload, opts = {}) {
  let indexedDocs;
  let erroredDocuments = [];
  // add more configuration if needed later. See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/8.0/api-reference.html#_bulk
  const bulkConfig = {
    ...opts,
    refresh: 'true',
  }
  const body = payload;
  const { body: bulkResponse } = await client.bulk({ refresh: bulkConfig.refresh, body });

  if (bulkResponse.errors) {
    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document,
          // otherwise it's very likely a mapping error, and you should
          // fix the document before to try it again.
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        })
      }
    })
    console.log('bulk index erroredDocuments:', erroredDocuments)
  }
  // console.log('number of docs without errors:', payload.length() - erroredDocuments.length())
  console.log('MONKEY_BANANA INDEXNAME:', indexName)
  const { body: count } = await client.count({ index: indexName })
  return { indexCounts: count, erroredDocuments }
}

const clientMethods = {
  getClusterInfo,
  pingCluster,
  getAllAmbientWeatherIndices,
  getAmbientWeatherAliases,
  createIndex,
  deleteIndex,
  getMostRecentDoc,
  bulkIndexDocuments
}
// clientMethods.getClusterInfo();
// clientMethods.pingCluster();
// clientMethods.getAllAmbientWeatherIndices();
// clientMethods.getClusterIndices();
// clientMethods.getAmbientWeatherAliases();
// clientMethods.getAmbientWeatherAliases();
// clientMethods.getMostRecentDoc(require('./esClient'), ['ambient_weather_heiligers_imperial_*', 'ambient_weather_heiligers_metric_*'], opts = { size: 4, _source: ['date', 'dateutc', '@timestamp'] })
// const testMappings = {
//   properties: {
//     id: { type: 'integer' },
//     text: { type: 'text' },
//     user: { type: 'keyword' },
//     time: { type: 'date' }
//   }
// }
// clientMethods.createIndex(require('./esClient'), 'tweets', testMappings)
// clientMethods.deleteIndex(require('./esClient'), 'tweets')
module.exports = { pingCluster, getAmbientWeatherAliases, createIndex, getMostRecentDoc, deleteIndex, bulkIndexDocuments };


