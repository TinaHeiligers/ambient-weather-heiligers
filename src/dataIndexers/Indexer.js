const esClient = require('./esClient');
const { pingCluster, getAmbientWeatherAliases } = require('./esClientMethods');
const { Logger } = require('../logger')
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
function retryForCount(fn, count = 10) {
  if (count > 0) {
    return fn
  } else {
    throw Error('exceeded max number of retries asked for');
  }
}


class IndexData {
  #dataToIndex = [];

  constructor(esClient) {
    this.client = esClient;
    this.logger = new Logger('indexer');
  }
  // returns true if we get a positive response from pinging the cluster, otherwise returns false
  async ensureConnection() {
    return await pingCluster(this.client);
  }
  // returns an array containing the write indices for the metric and imperial data in any order
  async getActiveWriteIndices() {
    let currentIndices;
    let activeIndices = { metric: '', imperial: '' };
    const aliasesResults = await getAmbientWeatherAliases(this.client);
    currentIndices = aliasesResults.filter(aliasEntry => (aliasEntry.is_write_index === 'true')).map((entry => entry.index))
    return currentIndices;
  }

  // testing composed implementation
  async run() {
    const haveConnection = await this.ensureConnection();
    if (!haveConnection) {
      // retryForCount(this.ensureConnection.bind(this))() --> implement later
      this.logger.logWarning('Cannot establish a connection with remote cluster')
      console.warn()
    } else {
      // do stuff
      await bulkIndexData(this.client, data, dataType);
    }
  }
}

module.exports = IndexData;

