/*
Usage examples in https://joelrbrandt.github.io/mockfs/ with code execution in https://github.com/joelrbrandt/mockfs/blob/master/js/mockfs.js
*/

const mock = require('mock-fs');

mock({
  'path/to/fake/dir': {
    'some-file.txt': 'file content here',
    'empty-dir': {/** empty directory */ }
  },
  'path/to/some.png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
  'some/other/path': {/** another empty directory */ }
});
// after a test runs
mock.restore();

// mock.file(properties) --> factory for creating new files
mock({
  foo: mock.file({
    content: 'file content here',
    ctime: new Date('1995-12-17T03:24:00'),
    mtime: new Date('1995-12-17T03:24:00')
  })
});
// creating directories
// note that this could also be written as
// mock({'path/to/dir': { /** config */ }})
mock({
  path: {
    to: {
      dir: {
        file1: 'text content',
        file2: Buffer.from([1, 2, 3, 4])
      }
    }
  }
});

// default mode is 0777 -> read/write/execute all allowed
mock({
  'some/dir': mock.directory({
    items: {
      file1: 'file one content',
      file2: Buffer.from([8, 6, 7, 5, 3, 0, 9])
    }
  })
});

// have to create and restore the mocks for EACH test.
beforeEach(function () {
  mock({
    'fake-file': 'file contents'
  });
});
afterEach(mock.restore);

// .toMatchSnapshot in Jest uses fs to load existing snapshots. If mockFs is active, Jest isn't able to load existing snapshots. In such case it accepts all snapshots without diffing the old ones, which breaks the concept of snapshot testing.

// Calling mock.restore() in afterEach is too late and it's necessary to call it before snapshot matching:
// using with snapshots, restore the mock before the test assertion.
const actual = testedFunction()
mock.restore()
expect(actual).toMatchSnapshot()
