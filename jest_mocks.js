// actual code
var fs = require('fs');
var reader = {
  read: function (path) {
    return fs.readFileSync(path, 'utf8');
  },
  write: function (path, object) {
    fs.writeFileSync(path, object);
  }
};
module.exports = reader;

// jest test with mocks
const Reader = require('../reader.js');
const sinon = require('sinon');
const fs = require('fs');
const expect = require('expect.js');

describe('reader.js test', function () {

  let readFileSync;
  let writeFileSync;

  beforeEach(() => {
    readFileSync = sinon.stub(fs, 'readFileSync').returns({});
    writeFileSync = sinon.stub(fs, 'writeFileSync').returns({});
  });
  afterEach(() => {
    readFileSync.restore();
    writeFileSync.restore();
  });

  it('should return a simple string', () => {

    Reader.read('files/expense.csv');
    expect(readFileSync.calledOnceWith('files/expense.csv', 'utf8')).to.be(true);
  });

  it('should write a json object', () => {

    Reader.write('files/expense.csv', 'test');
    expect(writeFileSync.calledOnceWith('files/expense.csv', 'test')).to.be(true);
  });
});
