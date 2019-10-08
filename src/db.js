const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime, Interval } = require('luxon')

const Stops = require('gtfs/models/gtfs/stop')
const Routes = require('gtfs/models/gtfs/route')
const Trips = require('gtfs/models/gtfs/trip')
const StopTimes = require('gtfs/models/gtfs/stop-time')
const Calendars = require('gtfs/models/gtfs/calendar')
const CalendarDates = require('gtfs/models/gtfs/calendar-date')
const Agencies = require('gtfs/models/gtfs/agency')

let conn = null
const mongoURI = process.env.MONGO_URI

module.exports.connectToDatabase = async function (context) {
  console.log('Creating connection.')
  if (conn == null) {
    conn = await mongoose.connect(mongoURI, {
      // Buffering means mongoose will queue up operations if it gets
      // disconnected from MongoDB and send them when it reconnects.
      // With serverless, better to fail fast if not connected.
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // and MongoDB driver buffering
      connectTimeoutMS: 1000
    })
  } else {
    console.log('Already connected!')
  }
  conn.model('Stops', Stops.schema)
  conn.model('Routes', Routes.schema)
  conn.model('Trips', Trips.schema)
  conn.model('StopTimes', StopTimes.schema)
  conn.model('Calendars', Calendars.schema)
  conn.model('CalendarDates', CalendarDates.schema)
  conn.model('Agencies', Agencies.schema)
  console.log('Connected')
  return conn
}

const getServiceCodesForDate = async (searchDate, agencyKey) => {
  const dayName = searchDate.toFormat('EEEE').toLowerCase()
  const calendars = await Calendars.find({ agency_key: agencyKey }).exec()
  const serviceIds = []
  console.log(`there are ${calendars.length} calendars`)
  calendars.forEach(item => {
    // Sometimes GTFS data contains rows with no actual data,
    // We can ignore those.
    if (item.service_id) {
      // also ensure that today is within the valid date range
      const startDate = DateTime.fromFormat(item.start_date.toString(), 'yyyyLLdd')
      const endDate = DateTime.fromFormat(item.end_date.toString(), 'yyyyLLdd')
      const interval = Interval.fromDateTimes(startDate, endDate)

      if (item[dayName] && interval.contains(searchDate)) {
        serviceIds.push(item.service_id)
      }
    }
    // TODO: Indicate if there is no calendar dates
  })

  // add service IDs for calendar-dates
  const calendarDates = await CalendarDates.find({ agency_key: agencyKey }).exec()
  if (calendarDates.length) {
    calendarDates.forEach(item => {
      if (item.service_id) {
        const date = DateTime.fromFormat(item.date.toString(), 'yyyyLLdd')

        if (+date === +searchDate) {
          if (item.exception_type === 1) { // INCLUDE service on this date
            serviceIds.push(item.service_id)
          } else if (item.exception_type === 2) { // EXCLUDE service from this date
            // log(item.service_id)
            _.pull(serviceIds, item.service_id)
          }
        }
      }
    })
  }

  return serviceIds
}

const getTripsFromRouteNames = async (serviceIds, routes, agencyKey) => {
  let trips
  if (routes) { // only filter by routenames if the caller passed in routenames
    const routeIds = _.map(routes, 'route_id')
    trips = await Trips.find(
      {
        route_id: { $in: routeIds },
        service_id: { $in: serviceIds },
        agency_key: agencyKey
      },
      'trip_id route_id service_id trip_headsign'
    ).exec()
  } else {
    trips = await Trips.find({
      service_id: { $in: serviceIds },
      agency_key: agencyKey
    }, 'trip_id route_id service_id trip_headsign'
    ).exec()
  }

  return trips
}

const getRoutesFromIDs = async (routeIDs = [], agencyKey) => {
  const objIds = routeIDs.map(x => mongoose.Types.ObjectId(x))
  let query
  if (routeIDs.length) {
    query = {
      _id: {
        $in: objIds
      },
      agency_key: agencyKey
    }
  } else {
    query = {
      agency_key: agencyKey
    }
  }

  const routes = await Routes.find(query, 'route_id route_short_name').exec()
  return routes
}

module.exports.getStopTimes = async (obj, { routes, date }, context) => {
  console.log(date)
  const serviceCodes = await getServiceCodesForDate(DateTime.fromJSDate(date), obj.agency_key)
  const routesObjs = await getRoutesFromIDs(routes, obj.agency_key)
  console.log(routesObjs)
  console.log(serviceCodes)
  const trips = await getTripsFromRouteNames(serviceCodes, routesObjs, obj.agency_key)

  const query = {
    stop_id: obj.stop_id,
    pickup_type: { $not: { $eq: '1' } }, // added for WTA, bc they don't put 0 on regular pickups
    stop_is_last: { $not: { $eq: '1' } }, // added for NCTD
    agency_key: obj.agency_key
  }

  if (trips) {
    query.trip_id = { $in: _.map(trips, 'trip_id') }
  }

  let stopTimes = await StopTimes.find(query).exec()

  stopTimes = _.sortBy(stopTimes, s =>
    DateTime.fromFormat(s.departure_time, 'H:mm:ss')
  )
  return stopTimes
}
