const { sql } = require('slonik')

exports.getRoutes = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('routes').where({ feed_index: obj.feed_index })
}

exports.getRoutesFromStop = async function (obj, args, { slonik }) {
  const res = await slonik.any(sql`
    SELECT DISTINCT * FROM gtfs.routes
      WHERE feed_index = ${obj.feed_index}
      AND route_id IN
        (SELECT route_id FROM gtfs.trips
        WHERE gtfs.trips.feed_index = ${obj.feed_index}
        AND gtfs.trips.trip_id IN
          (SELECT trip_id FROM gtfs.stop_times
          WHERE gtfs.stop_times.feed_index = ${obj.feed_index}
          AND gtfs.stop_times.stop_id = ${obj.stop_id}
          )
        )
  `)
  return res
}
