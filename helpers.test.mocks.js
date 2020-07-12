/*
TODO:
  getLastRecordedUTCDate
  calcMinutesDiff
*/

jest.mock()
const mockPath = {
  join: jest.fn((a) => `${__dirname}/data/${a}`)
}

const mockFs = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}
const mockGetLastRecordedUTCDate = jest.fn();
const mockCalcMinutesDiff = jest.fn();
