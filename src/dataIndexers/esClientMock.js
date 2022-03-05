const { Client } = require('@elastic/elasticsearch')
const Mock = require('@elastic/elasticsearch-mock')
const { ResponseError } = require('@elastic/elasticsearch/lib/errors')
const { match } = require('assert')


const mock = new Mock()
const client = new Client({
  node: 'http://localhost:9200',
  Connection: mock.getConnection()
})

mock.add({
  method: 'GET',
  path: '/'
}, () => {
  return { status: 'ok' }
});

client.info(console.log);

// every search request gets this response
mock.add({
  method: 'POST',
  path: '/indexName/_search'
}, () => {
  return {
    hits: {
      total: { value: 1, relation: 'eq' },
      hits: [{ _source: { baz: 'faz' } }]
    }
  }
});
// every search request that uses the query in the body hets this response
mock.add({
  method: 'POST',
  path: '/indexName/_search',
  body: { query: { match: { foo: 'bar' } } }
}, () => {
  return {
    hits: {
      total: { value: 0, relation: 'eq' },
      hits: []
    }
  }
});

// mocking dynamic paths (this one mocks any GET request to an index for _count):
mock.add({
  method: 'GET',
  path: '/:index/_count'
}, () => {
  return { count: 42 }
});

// mocking a randomly failing request
mock.add({
  method: 'GET',
  path: '/:index/_count'
}, () => {
  if (match.random() > 0.8) {
    return ResponseError({ body: {}, statusCode: 500 })
  } else {
    return { count: 42 }
  }
});
