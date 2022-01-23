const esClient = require('./esClient');
const { pingCluster, getAmbientWeatherAliases, getMostRecentDoc, createIndex, deleteIndex, bulkIndexDocuments } = require('./esClientMethods');
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
/**
 * @implements elasticsearch client to communicate with the cluster
 */
class IndexData {
  #dataToIndex = [];
  #dateOflatestIndexedMetricDoc = ''; // dateString
  #dateOflatestIndexedImperialDoc = ''; // dateString
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
  get currentWriteIndices() {
    return this.#currentWriteIndices;
  };
  set currentWriteIndices(indexNames) {
    this.#currentWriteIndices = Array.isArray(indexNames) ? indexNames : [indexNames];
  };
  get dateOflatestIndexedMetricDoc() {
    return this.#dateOflatestIndexedMetricDoc;
  };
  set dateOflatestIndexedMetricDoc(dateString) {
    this.#dateOflatestIndexedMetricDoc = dateString;
  }
  get dateOflatestIndexedImperialDoc() {
    return this.#dateOflatestIndexedImperialDoc;
  }
  set dateOflatestIndexedImperialDoc(dateString) {
    this.#dateOflatestIndexedImperialDoc = dateString;
  }

  /**
   * @param
   * @returns {boolean} response from pinging the cluster
   */
  // using arrow to bind to the instance that calls this. See https://dmitripavlutin.com/differences-between-arrow-and-regular-functions/
  async ensureConnection() {
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
    let result;
    const aliasesResults = await getAmbientWeatherAliases(this.client);
    const currentIndices = aliasesResults
      .filter(aliasEntry => (aliasEntry.is_write_index === 'true'))
      .map((entry => entry.index))
    if (currentIndices && currentIndices.length > 0) {
      this.currentWriteIndices = currentIndices;
      result = currentIndices;
    }
    this.logger.logInfo('[getActiveWriteIndices] [ RESULT ]:', this.currentWriteIndices)
    return result;
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
    console.log()

    const metricIndexToSearch = this.currentWriteIndices.filter(name => name.includes('metric'))[0];
    const imperialIndexToSearch = this.currentWriteIndices.filter(name => name.includes('imperial'))[0];

    const opts = { size: 1, _source: ['date', 'dateutc', '@timestamp'], sortBy: [{ field: "dateutc", direction: "desc" }], expandWildcards: 'all' }

    const latestMetricDocResult = await getMostRecentDoc(this.client, metricIndexToSearch, opts);
    const latestImperialDocResult = await getMostRecentDoc(this.client, imperialIndexToSearch, opts);

    this.logger.logInfo('[getMostRecentIndexedDocuments] [metric RESULT]', JSON.stringify(latestMetricDocResult))
    this.logger.logInfo('[getMostRecentIndexedDocuments] [imperial RESULT]', JSON.stringify(latestImperialDocResult))

    this.dateOflatestIndexedMetricDoc = latestMetricDocResult[0]._source.dateutc; // use dateutc instead
    this.dateOflatestIndexedImperialDoc = latestImperialDocResult[0]._source.dateutc; // use dateutc instead

    return { latestImperialDoc: latestImperialDocResult, latestMetricDoc: latestMetricDocResult };
  }

  /**
   *
   * @param {array} payload array of preformatted documents to index (output of prepare docs for bulk indexing)
   * @param {string} dataType data unit type the bulk operation, one of 'metric' or 'imperial'
   * @returns TBD
   */
  async bulkIndexDocuments(payload, dataType) {
    const body = payload;
    const indexName = this.#currentWriteIndices.filter(name => name.includes(dataType))[0];
    const result = await bulkIndexDocuments(this.client, indexName, body);
    console.log('RESULT FROM BULK INDEX:', result)
    //
    return result;
  }

  /**
  * Pings cluster to see if we have a connection
  * if we have a connection, gets the active write indices
  * fetches the most recent date (in milliseconds) for the data that's in the cluster
  * ATM, returns object containing the
  * @returns {object} { latestImperialDoc, latestMetricDoc, outcome <string> } full hit result from the most recently indexed documents in the write indices
  */
  async initialize() {
    const haveConnection = await this.ensureConnection();
    if (!haveConnection) {
      // retryForCount(this.ensureConnection) --> implement later, see https://github.com/elastic/kibana/blob/main/src/core/server/elasticsearch/client/retry_call_cluster.ts
      this.logger.logWarning('Cannot establish a connection with remote cluster');
      return 'no connection'
    }
    this.logger.logInfo('Cluster ping success! We are live :-)');
    // main workflow through here to setup and prepare for bulk indexing
    // get the current write indices
    const currentIndices = await this.getActiveWriteIndices();
    if (currentIndices && Array.isArray(currentIndices) && currentIndices.length > 0) {
      const { latestImperialDoc, latestMetricDoc } = await this.getMostRecentIndexedDocuments();
      return { latestImperialDoc, latestMetricDoc, outcome: 'success' }
    }
    return { latestImperialDoc: null, latestMetricDoc: null, outcome: 'error: no currentIndices found or non returned' };
    // await bulkIndexData(this.client, data, dataType);
  }
}


module.exports = IndexData;

