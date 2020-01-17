const { Duration } = require('luxon')

// luxon duration is used to contain the timestamp since it can contain times past 24 hours
// timepoints in the next service day will be in the next day's time 
exports.getLuxonDurationFromInterval = function (obj, args, { knex }) {
  return Duration.
  console.log(obj)
}
