const { Client } = require('@elastic/elasticsearch');
const assert = require('assert');
const config = {
  cloud_id: process.env.STAGING_CLOUD_ID,
  username: process.env.STAGING_ES_USERNAME,
  password: process.env.STAGING_ES_PASSWORD,
}
// this will probssbly need to be a class with methods
// class because we want to inject the auth creds from an .env file
// methods will include the searching for the latest indexed doc and bulk index along with others probably.
// for now, just test that the client actually works.
assert.ok(config.cloud_id, 'Cloud id needs to be configured');
assert.ok(config.username, 'Cloud es cluster username needs to be configured');
assert.ok(config.password, 'Cloud es cluster password needs to be configured');
const client = new Client({
  cloud: {
    id: config.cloud_id,
  },
  auth: {
    username: config.username,
    password: config.password
  }
});

module.exports = client;
