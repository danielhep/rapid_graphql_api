const { Duration } = require('luxon')

// luxon duration is used to contain the timestamp since it can contain times past 24 hours
// timepoints in the next service day will be in the next day's time
// this is a generator that accepts 'arrival' or 'depature'
exports.getLuxonDurationFromInterval = (arrivalOrDeparture) => function (obj, args, { knex }) {
  const timeObj = { hours: null, minutes: null, seconds: null }
  if (arrivalOrDeparture === 'arrival') {
    timeObj.hours = obj.arrival_time.hours
    timeObj.minutes = obj.arrival_time.minutes
    timeObj.seconds = obj.arrival_time_seconds
  } else if (arrivalOrDeparture === 'departure') {
    timeObj.hours = obj.departure_time.hours
    timeObj.minutes = obj.departure_time.minutes
    timeObj.seconds = obj.departure_time_seconds
  }

  return Duration.fromObject(timeObj)
}

exports.getTripFromStopTime = async function (obj, args, { knex }) {
  const where = {
    trip_id: obj.trip_id,
    feed_index: obj.feed_index
  }

  return knex.withSchema('gtfs').select().where(where).from('trips').first()
}
