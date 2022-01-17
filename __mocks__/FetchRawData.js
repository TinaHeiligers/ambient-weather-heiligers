const mockAWApi = {
  userDevices: jest.fn(),
  deviceData: jest.fn()
};

const mockFs = {
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn()
};

const mockPath = {
  join: jest.fn()
};

const mockFetchRawData = {
  getDataForDateRanges: jest.fn()
}

module.exports = {
  mockAWApi,
  mockFs,
  mockPath,
  mockFetchRawData,
}
