const { Client } = require('@elastic/elasticsearch');
// this will probssbly need to be a class with methods
// class because we want to inject the auth creds from an .env file
// methods will include the searching for the latest indexed doc and bulk index along with others probably.
// for now, just test that the client actually works.
const client = new Client({
  cloud: {
    id: 'staging-weather-tracker:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJDVjZTFmMTVlNDdjMDQ3MzBiNjgwZjJlYTVjNDY2ODdjJDUzY2NlMWUzMTBkZTRlMzY4YmNhMGM1MDQxZmUxZjVi',
  },
  auth: {
    username: 'elastic',
    password: 'B4S4T7nsWoi4bEAUtrmAhaOQ'
  }
});

module.exports = client;
