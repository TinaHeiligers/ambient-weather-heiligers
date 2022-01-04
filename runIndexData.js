const IndexData = require('./src/dataIndexers');
const dataIndexer = new IndexData();
// const haveCluster = dataIndexer.ensureConnection()
//   .then(res => console.log('haveCluster?', res))
//   .catch(err => console.error('haveClusterError:', err));
const currentMetricIndex = dataIndexer.getActiveWriteIndices()
  .then(res => console.log('do we have the metric and imperial index names?:', res))
  .catch(err => console.error('dataIndexer.getActiveWriteIndices error', err))

dataIndexer.run()

module.exports = currentMetricIndex;

