const esClient = require('./esClient');
const { pingCluster, getAmbientWeatherAliases, getMostRecentDoc } = require('./esClientMethods');
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
   * @example

   */
  async getActiveWriteIndices() {
    this.logger.logInfo('[getActiveWriteIndices] [START]')
    const aliasesResults = await getAmbientWeatherAliases(this.client);
    const currentIndices = aliasesResults
      .filter(aliasEntry => (aliasEntry.is_write_index === 'true'))
      .map((entry => entry.index))
    if (currentIndices && currentIndices.length > 0) {
      this.currentWriteIndices = currentIndices;
    }
    this.logger.logInfo('[getActiveWriteIndices] [ RESULT ]:', this.currentWriteIndices)
    return currentIndices;
  }
  /**
   * @param
   * @returns array containing selected info about the most recent document indexed for both the metric and imperial write indices as returned from the alias search.
   * @example
    [{
        _index: 'ambient_weather_heiligers_imperial_2021_12_30',
        _type: '_doc',
        _id: 'kg3CDH4B6j-JQh_0EA4y',
        _score: null,
        _source: {
          date: '2021-12-30T19:05:00.000Z',
          dateutc: 1640891100000,
          '@timestamp': '2021-12-30T19:12:28.893Z'
        },
        sort: [ 1640891100000 ]
      },
      {
        _index: 'ambient_weather_heiligers_metric_2021_12_30',
        _type: '_doc',
        _id: 'Gw3CDH4B6j-JQh_0IRGK',
        _score: null,
        _source: {
          date: '2021-12-30T19:05:00.000Z',
          dateutc: 1640891100000,
          '@timestamp': '2021-12-30T19:12:34.576Z'
        },
        sort: [ 1640891100000 ]
      }]
   */
  async getMostRecentIndexedDocuments() {
    this.logger.logInfo('[getMostRecentIndexedDocuments] [START]')
    // call signature: clientMethods.getMostRecentDoc(require('./esClient'), ['ambient_weather_heiligers_imperial_*', 'ambient_weather_heiligers_metric_*'], opts = { size: 4, _source: ['date', 'dateutc', '@timestamp'] })
    const indexToSearch = this.currentWriteIndices;
    const opts = { size: 2, _source: ['date', 'dateutc', '@timestamp'] }
    const latestDoc = await getMostRecentDoc(this.client, indexToSearch, opts);
    this.logger.logInfo('[getMostRecentIndexedDocuments] [RESULT]', latestDoc)
    return latestDoc;
  }

  // as the name implies, we need to define how we determine what's 'new' data
  // async indexNewData(newData) {
  //   // either the subclasses need to imit what the new data is or we need to fetch it from file
  //   const mostRecentMetricEntry = await getMostRecentDoc('metric');
  //   const mostRecentImperialEntry = await getMostRecentDoc('imperial');
  //   // we can now search through all the data we have on file for more recent json objects

  // }

  /**
   * @returns {boolean} result from bulk indexing data
   */
  async run() {
    const haveConnection = await this.ensureConnection();
    if (!haveConnection) {
      // retryForCount(this.ensureConnection) --> implement later, see https://github.com/elastic/kibana/blob/main/src/core/server/elasticsearch/client/retry_call_cluster.ts
      this.logger.logWarning('Cannot establish a connection with remote cluster')
    } else {
      // get the current write indices
      await this.getActiveWriteIndices();
      if (this.currentWriteIndices && this.currentWriteIndices.length > 0) {
        await this.getMostRecentIndexedDocuments();
      }



      // do stuff
      // await bulkIndexData(this.client, data, dataType);
    }
  }
}

module.exports = IndexData;

