const main = require('../../main.js');
const mocks = require('../../__mocks__/FetchRawData.js');

const mockAWApi = mocks.mockAWApi;
const mockFs = mocks.mockFs;
const mockFetchRawData = mocks.mockFetchRawData;

describe('main', () => {
  let mockedFetchedData = [];
  let mockedFiles = [];
  let mockedData = [];
  beforeAll(() => {
    mockFs.readdirSync.mockClear();
    mockFs.readFileSync.mockClear();
    mockFetchRawData.getDataForDateRanges.mockClear();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  })
  it('works', async () => {
    mockFetchRawData.getDataForDateRanges
      .mockReturnValueOnce({
        dataFetchForDates: [{ from: 1595055600000, to: 1595142000000 }], dataFileNames: ['1595055600000_1595142000000']
      })
    const result = await main();
    expect(result).toBe('undefined')
  })
})
