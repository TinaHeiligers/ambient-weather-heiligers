const HOURS_PER_DAY = 24;
const MIN_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const ONE_DAY_AS_MILLISECONDS = HOURS_PER_DAY * MIN_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND; // 24hrs * 60 min * 60 sec * 1000 milliseconds/second

const timeConstants = {
  hours_per_day: HOURS_PER_DAY,
  min_per_hour: MIN_PER_HOUR,
  seconds_per_minute: SECONDS_PER_MINUTE,
  milliseconds_per_second: MILLISECONDS_PER_SECOND,
  one_day_as_milliseconds: ONE_DAY_AS_MILLISECONDS
}

module.exports = timeConstants;
