const { Interval, DateTime } = require('luxon')
const { sql } = require('slonik')

exports.getServiceIDsFromDate = async function ({ date, feed_index, slonik }) {
  const dayOfWeek = date.weekdayLong.toLowerCase()
  const res = await slonik.anyFirst(sql`
        (SELECT service_id FROM gtfs.calendar 
          WHERE 
          gtfs.calendar.feed_index = ${feed_index}
          AND 
          ${date.toSQL({ includeOffset: false })} BETWEEN start_date AND end_date
          AND
          ${sql.identifier(['gtfs', 'calendar', dayOfWeek])} = 1
          AND
          -- exclusde anything in calendar_dates with an exception type of 2
          service_id NOT IN 
            (SELECT service_id
            FROM gtfs.calendar_dates
            WHERE gtfs.calendar_dates.feed_index = ${feed_index}
            AND gtfs.calendar_dates.date = ${date.toSQL({ includeOffset: false })}
            -- exception_type of 2 means service ID is REMOVED on this day
            AND gtfs.calendar_dates.exception_type = 2)
        )
        UNION
        (SELECT service_id FROM gtfs.calendar_dates
          WHERE feed_index = ${feed_index}
          AND 
          date = ${date.toSQL({ includeOffset: false })}
          AND 
          -- exception_type = 1 means service is ADDED on this day
          exception_type = 1
          )
    `)

  return res
}
