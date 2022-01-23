const IndexData = require('./src/dataIndexers');
const dataIndexer = new IndexData();
// const haveCluster = dataIndexer.ensureConnection()
//   .then(res => console.log('haveCluster?', res))
//   .catch(err => console.error('haveClusterError:', err));
const currentMetricIndex = dataIndexer.initialize()
  .then(res => console.log('do we have the metric and imperial index names?:', res))
  .catch(err => console.error('dataIndexer.getActiveWriteIndices error', err))


// ultimately, I want to involke this with:
// dataIndexer.indexNewData();


module.exports = currentMetricIndex;

