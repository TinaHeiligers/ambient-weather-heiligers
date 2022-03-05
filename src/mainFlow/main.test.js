const main = require('../../main.js');
const mocks = require('../../__mocks__/FetchRawData.js');

const mockAWApi = mocks.mockAWApi;
const mockFs = mocks.mockFs;
const mockFetchRawData = mocks.mockFetchRawData;

describe.skip('main', () => {
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
        dataFetchForDates: [{ from: 1642377600000, to: 1642446000000 }],
        dataFileNames: ['1642377600000_1642446000000']
      })
    const result = await main();
    expect(result).toBe('undefined')
  })
})
