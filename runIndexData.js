const IndexData = require('./src/dataIndexers');
const dataIndexer = new IndexData();
const haveCluster = dataIndexer.ensureConnection()
  .then(res => console.log('haveCluster?', res))
  .catch(err => console.error('haveClusterError:', err));
// console.log('haveCluster?', haveCluster)
const currentMetricIndex = dataIndexer.getCurrentIndices()
  .then(res => console.log('currentMetricIndex?:', res))
  .catch(err => console.error('currentMetricIndexError', err))
// console.log('currentMetricIndex?', currentMetricIndex)
module.exports = haveCluster;

