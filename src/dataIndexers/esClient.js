const { Client } = require('@elastic/elasticsearch');
const assert = require('assert');

function initEsClient() {
  const envConfig = {
    cloud_id: process.env.STAGING_CLOUD_ID,
    username: process.env.STAGING_ES_USERNAME,
    password: process.env.STAGING_ES_PASSWORD,
  }

  let missingEnvEntries = [];
  if (!envConfig.cloud_id) missingEnvEntries.push('cloud_id')
  if (!envConfig.username) missingEnvEntries.push('username')
  if (!envConfig.password) missingEnvEntries.push('password');

  assert.ok(envConfig.cloud_id, 'Cloud id needs to be configured');
  assert.ok(envConfig.username, 'Cloud es cluster username needs to be configured');
  assert.ok(envConfig.password, 'Cloud es cluster password needs to be configured');

  const client = new Client({
    cloud: {
      id: envConfig.cloud_id,
    },
    auth: {
      username: envConfig.username,
      password: envConfig.password
    }
  });
  return client;
}

const client = initEsClient()

module.exports = client;
