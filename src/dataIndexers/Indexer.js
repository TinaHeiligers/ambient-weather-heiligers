const esClient = require('./esClient');
const { pingCluster } = require('./esClientMethods');

/*
What do I want to do here?
- ensure we have a connection to es
- retrieve the current active indices we're writing to
- retrieve the data we want to index
- do any final transformations we need to that used to be handled by logstash (e.g. the date-time splitting)
- do the bulk indexing
- retrieve the most recent document we've indexed and validate the indecing operation

- later on:
- set up ILM to roll over the indices
- deduplicate any data that might be duplicated
- add new indices
- add new templates
*/

class IndexData {
  constructor(esClient) {
    this.client = esClient;
  }
  async ensureConnection() {
    return await pingCluster(this.client);
  }
}

module.exports = IndexData;

