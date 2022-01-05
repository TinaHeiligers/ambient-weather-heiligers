const esClient = require('./esClient');
const { pingCluster, getAmbientWeatherAliases } = require('./esClientMethods');
const Logger = require('../logger');
/*
What do I want to do here?
- ensure we have a connection to es
- retrieve the current active indices we're writing to
- retrieve the data we want to index: -> this will be done in the composed module
- do any final transformations we need to that used to be handled by logstash (e.g. the date-time splitting)
- do the bulk indexing
- retrieve the most recent document we've indexed and validate the indecing operation

- later on:
- set up ILM to roll over the indices
- deduplicate any data that might be duplicated
- add new indices
- add new templates
*/
function retryForCount(fn, count = 0) {
  if (count < 9) {
    setTimeout(fn, count * 1000)
  } else {
    throw Error('exceeded max number of retries asked for');
  }
}

/**
 * @implements elasticsearch client to communicate with the cluster
 */
class IndexData {
  #dataToIndex = [];
  #writeIndex = [];
  #currentWriteIndices = [];

  constructor(esClient) {
    this.client = esClient;
    this.logger = new Logger('indexer');
  };
  get dataToIndex() {
    return this.#dataToIndex;
  };
  set dataToIndex(dataArray) {
    this.#dataToIndex = Array.isArray(dataArray) ? dataArray : [dataArray]
  };
  get writeIndex() {
    return this.#writeIndex;
  };
  set writeIndex(indexName) {
    this.#writeIndex = indexName;
  };
  get currentWriteIndices() {
    return this.#currentWriteIndices;
  };
  set currentWriteIndices(indexNameArray) {
    this.#currentWriteIndices = Array.isArray(indexNameArray) ? indexNameArray : [indexNameArray];
  };
  /**
   * @param
   * @returns {boolean} response from pinging the cluster
   */
  // using arrow to bind to the instance that calls this. See https://dmitripavlutin.com/differences-between-arrow-and-regular-functions/
  ensureConnection = async () => {
    return await pingCluster(this.client);
  }
  /**
   * gets the current write indices from the cluster
   * adds these names to the class
   * @returns undordered array containing the write indices' names for the metric and imperial data
   */
  async getActiveWriteIndices() {
    const aliasesResults = await getAmbientWeatherAliases(this.client);
    const currentIndices = aliasesResults
      .filter(aliasEntry => (aliasEntry.is_write_index === 'true'))
      .map((entry => entry.index))
    // .forEach(entry => entry.includes('metric') ? this.metricIndex = entry : this.imperial = entry);
    if (currentIndices && currentIndices.length > 0) {
      this.currentWriteIndices = currentIndices;
    }
    return currentIndices;
  }

  async getMostRecentIndexedDocument(dataType) {
    const latestDoc = await getMostRecentDoc(this.client, dataType);
    return latestDoc;
  }

  // as the name implies, we need to define how we determine what's 'new' data
  async indexNewData(newData) {
    // either the subclasses need to imit what the new data is or we need to fetch it from file
    const mostRecentMetricEntry = await getMostRecentIndexedDocument('metric')
    const mostRecentImperialEntry = await getMostRecentIndexedDocument('imperial')
    // we can now search through all the data we have on file for more recent json objects

  }

  /**
   * @returns {boolean} result from bulk indexing data
   */
  async run() {
    const haveConnection = await this.ensureConnection();
    if (!haveConnection) {
      // retryForCount(this.ensureConnection) --> implement later
      this.logger.logWarning('Cannot establish a connection with remote cluster')
    } else {
      // get the current write indices
      this.getActiveWriteIndices();


      // do stuff
      // await bulkIndexData(this.client, data, dataType);
    }
  }
}

module.exports = IndexData;

