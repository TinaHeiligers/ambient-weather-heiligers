const esClient = require('./esClient');
const { pingCluster, getAmbientWeatherAliases, getMostRecentDoc } = require('./esClientMethods');
const Logger = require('../logger');
const { dateStringToFileNamePartialString } = require('../utils')
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
  #dateOflatestIndexedMetricDoc = ''; // dateString
  #dateOflatestIndexedImperialDoc = ''; // dateString

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
  get dateOflatestIndexedMetricDoc() {
    return this.#dateOflatestIndexedMetricDoc;
  }

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
    // this.logger.logInfo('[getActiveWriteIndices] [START]')
    const aliasesResults = await getAmbientWeatherAliases(this.client);
    const currentIndices = aliasesResults
      .filter(aliasEntry => (aliasEntry.is_write_index === 'true'))
      .map((entry => entry.index))
    if (currentIndices && currentIndices.length > 0) {
      this.currentWriteIndices = currentIndices;
    }
    // this.logger.logInfo('[getActiveWriteIndices] [ RESULT ]:', this.currentWriteIndices)
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
    // this.logger.logInfo('[getMostRecentIndexedDocuments] [START]')
    const metricIndexToSearch = this.currentWriteIndices.filter(name => name.includes('metric'))[0];
    const imperialIndexToSearch = this.currentWriteIndices.filter(name => name.includes('imperial'))[0];
    const opts = { size: 1, _source: ['date', 'dateutc', '@timestamp'], sortBy: [{ field: "dateutc", direction: "desc" }], expandWildcards: 'all' }
    const latestMetricDoc = await getMostRecentDoc(this.client, metricIndexToSearch, opts);
    const latestImperialDoc = await getMostRecentDoc(this.client, imperialIndexToSearch, opts);
    // this.logger.logInfo('[getMostRecentIndexedDocuments] [metric RESULT]', latestMetricDoc)
    // this.logger.logInfo('[getMostRecentIndexedDocuments] [imperial RESULT]', latestImperialDoc)
    this.dateOflatestIndexedMetricDoc = latestMetricDoc[0]._source.date; // use dateutc instead
    this.dateOflatestIndexedImperialDoc = latestImperialDoc[0]._source.date; // use dateutc instead
    return { latestMetricDoc: latestMetricDoc, latestImperialDoc: latestImperialDoc };
  }

  /**
   * converts the date string for the most recently indexed documents to the same format used in the file names.
   * @returns {obj} dateOflatestIndexedImperialDoc <string>, dateOflatestIndexedMetricDoc <string>
   * @example
   { imperial: '20211230-T-1905', metric: '20211230-T-1905'}
   * note: in dev, the dates might not be the same. In prod, they should be the same.
   */
  latestIndexedDocsDatesInFileNameFormat() {
    return {
      imperialDataFileNameEnding: dateStringToFileNamePartialString(this.dateOflatestIndexedImperialDoc),
      metricDataFileNameEnding: dateStringToFileNamePartialString(this.dateOflatestIndexedMetricDoc)
    }
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
  async initialize() {
    const haveConnection = await this.ensureConnection();
    if (!haveConnection) {
      // retryForCount(this.ensureConnection) --> implement later, see https://github.com/elastic/kibana/blob/main/src/core/server/elasticsearch/client/retry_call_cluster.ts
      this.logger.logWarning('Cannot establish a connection with remote cluster')
    } else {
      // main workflow through here to setup and prepare for bulk indexing
      // get the current write indices
      await this.getActiveWriteIndices();
      if (this.currentWriteIndices && this.currentWriteIndices.length > 0) {
        const { latestMetricDoc, latestImperialDoc } = await this.getMostRecentIndexedDocuments();
      }
      return { lastIndexedImperialDataDate: this.dateOflatestIndexedImperialDoc, lastIndexedMetricDataDate: this.dateOflatestIndexedMetricDoc }
      // await bulkIndexData(this.client, data, dataType);
    }
  }
}

module.exports = IndexData;

