const IndexData = require('./src/dataIndexers');
const dataIndexer = new IndexData();
const haveCluster = dataIndexer.ensureConnection()
  .then(res => console.log(res))
  .catch(err => console.error(err));
console.log('haveCluster?', haveCluster)
module.exports = haveCluster;

