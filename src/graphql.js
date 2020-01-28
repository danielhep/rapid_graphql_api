const { ApolloServer, gql } = require('apollo-server-lambda')
const { GraphQLDate } = require('graphql-iso-date')
const db = require('./db')
// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar Date
  scalar Time

  type Location {
    lat: Float
    long: Float
  }
  
  type Feed {
    feed_index: Int
    feed_publisher_name: String
    feed_publisher_url: String
    feed_location_string: String
    agencies: [Agency]
    stops: [Stop]
    routes: [Route]
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
    stop_id: String
    zone_id: String
    stop_times(date: Date, routes: [ID]): [StopTime]
  }

  type StopTime {
    trip: Trip
    arrival_time: Time
    departure_time: Time
    stop_id: ID
    stop_sequence: Int
    stop_headsign: String
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

// Provide resolver functions for your schema fields
// Resolver functions accept 3 arguments: Previous object, arguments, and context.
const resolvers = {
  Date: GraphQLDate,
  Query: {
    agencies: require('./database/agency').getAgencies,
    agency: require('./database/agency').getAgency,
    feeds: require('./database/feed').getFeeds,
    feed: (obj, { feed_index }) => { feed_index }
  },
  Feed: {
    agencies: require('./database/agency').getAgencies,
    routes: require('./database/route').getRoutes,
    stops: require('./database/stop').getStops
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
  Stop: { stop_times: require('./database/stop').getStopTimes },
  StopTime: {
    trip: require('./database/stoptime').getTripFromStopTime,
    departure_time: require('./database/stoptime').getLuxonDurationFromInterval('departure'),
    arrival_time: require('./database/stoptime').getLuxonDurationFromInterval('arrival')
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
