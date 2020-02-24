const { DateTime, Interval } = require('luxon')
const { sql } = require('slonik')

exports.getStops = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('stops').where({ feed_index: obj.feed_index })
}

exports.getStopsJson = async function (obj, args, { slonik }) {
  const stops = await slonik.anyFirst(sql`
    SELECT ST_AsGeoJSON(stops.*)
    FROM gtfs.stops
    WHERE feed_index=${obj.feed_index}
  `)
  return stops.map(x => JSON.parse(x))
}

// Args: stop_id
// Obj: feed_index,
exports.getStop = async function getStop (obj, args, context) {
  return context.knex.withSchema('gtfs').select().where({ ...args, feed_index: obj.feed_index }).from('stops').first()
}

// args: routes, date
// obj: stop
exports.getStopTimes = async function getStopTimes (obj, args, { slonik }) {
  const datetimeobj = DateTime.fromJSDate(args.date, { zone: 'UTC' })
  const serviceIDs = await require('../calendar/utils').getServiceIDsFromDate({ date: datetimeobj, feed_index: obj.feed_index, slonik })

  const stopTimes = await slonik.any(sql`
    SELECT * FROM gtfs.stop_times
    WHERE 
    stop_id = ${obj.stop_id}
    AND
    feed_index = ${obj.feed_index}
    AND
    trip_id IN
      (SELECT trip_id FROM gtfs.trips
      WHERE gtfs.trips.service_id = ANY(${sql.array(serviceIDs, sql`text[]`)})
      )
    ORDER BY departure_time
  `)

  let prevDepartureTime = null
  const stopTimesWithPrevStopTime = stopTimes.map((time) => {
    if (prevDepartureTime) {
      time.time_since_last = time.departure_time.minus(prevDepartureTime).normalize().toString()
    } else {
      time.time_since_last = null
    }

    prevDepartureTime = time.departure_time
    return time
  })

  return stopTimesWithPrevStopTime
}
