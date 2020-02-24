const { ApolloServer, gql } = require('apollo-server-lambda')
const { GraphQLDate } = require('graphql-iso-date')
// Construct a schema, using GraphQL schema language
const typeDefs = {
  ...gql`
  scalar Date
  scalar Time
  scalar PointObject

  type Location {
    lat: Float
    long: Float
  }
  
  type Feed {
    feed_index: Int
    feed_publisher_name: String
    feed_publisher_url: String
    feed_location_friendly: String
    feed_lat: Float
    feed_lon: Float
    agencies: [Agency]
    stops: [Stop]
    stops_json: [PointObject]
    routes: [Route]
    stop(stop_id: ID): Stop
  }

  type Route {
    _id: ID
    route_long_name: String
    route_type: Int
    route_color: String
    route_text_color: String
    route_id: String
    route_short_name: String
    stops: [Stop]
    trips: [Trip]
  }

  type Agency {
    agency_name: String
    agency_phone: String
    agency_id: ID
    agency_center: Location
    feed_index: Int
    stops: [Stop]
    routes: [Route]
    stop(stop_id: ID!): Stop
  }

  type Stop {
    id: ID
    loc: Location
    stop_code: String
    stop_name: String
    stop_id: ID
    zone_id: String
    stop_times(date: Date!, routes: [ID]): [StopTime]
    routes: [Route]
  }

  type StopJson {
    id: ID
  }

  type StopTime {
    trip: Trip
    arrival_time: Time
    departure_time: Time
    departure_time_readable: String
    stop_id: ID
    stop_sequence: Int
    stop_headsign: String
    is_even_hour: Boolean
    time_since_last: Time
    time_since_last_readable: String
  }

  type Trip {
    trip_id: ID
    trip_headsign: String
    route: Route
  }

  type Query {
    feed(feed_index: Int): Feed
    feeds: [Feed]
    agencies: [Agency]
    agency(agency_id: ID!, feed_index: ID!): Agency
  }
`
}

// Provide resolver functions for your schema fields
// Resolver functions accept 3 arguments: Previous object, arguments, and context.
const resolvers = {
  Date: GraphQLDate,
  Query: {
    agencies: require('./database/agency').getAgencies,
    agency: require('./database/agency').getAgency,
    feeds: require('./database/feed').getFeeds,
    feed: require('./database/feed').getFeed
    // feed: (obj, { feed_index }) => { feed_index }
  },
  Feed: {
    agencies: require('./database/agency').getAgencies,
    routes: require('./database/route').getRoutes,
    stops: require('./database/stop').getStops,
    stops_json: require('./database/stop').getStopsJson,
    stop: require('./database/stop').getStop
  },
  Agency: {
    routes: require('./database/route').getRoutes,
    stop: require('./database/stop').getStop,
    agency_center: ({ agency_center }) => {
      return {
        lat: agency_center[0],
        long: agency_center[1]
      }
    },
    stops: require('./database/stop').getStops
  },
  Stop: {
    stop_times: require('./database/stop').getStopTimes,
    routes: require('./database/route').getRoutesFromStop
  },
  StopTime: {
    trip: require('./database/stoptime').getTripFromStopTime,
    departure_time_readable: require('./database/stop/utils.js').getTimeFromDuration('departure_time'),
    is_even_hour: ({ departure_time }) => !(departure_time.hours % 2),
    time_since_last_readable: require('./database/stop/utils.js').getTimeFromDuration('time_since_last')
  },
  Trip: {
    route: require('./database/trip').getRouteFromTrip
  }
}

const dbConnections = require('./database')
const context = { knex: dbConnections.knex, slonik: dbConnections.slonik }
const server = new ApolloServer({ typeDefs, resolvers, context })
exports.graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true
  }
})
