const { ApolloServer, gql } = require('apollo-server-lambda')
const { GraphQLDate } = require('graphql-iso-date')
const db = require('./src/db.js')
// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  scalar Date

  type Location {
    lat: Float
    long: Float
  }
  
  type Route {
    _id: ID
    route_long_name: String
    route_type: Int
    route_color: String
    route_text_color: String
    route_id: String
    route_short_name: String
  }

  type Agency {
    agency_name: String
    agency_phone: String
    agency_id: ID
    agency_key: String
    agency_center: Location
    stops: [Stop]
    routes: [Route]
    stop(id: ID!): Stop
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
    arrival_time: String
    departure_time: String
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
    agencies: [Agency]
    agency(agency_key: String): Agency
  }
`

// Provide resolver functions for your schema fields
// Resolver functions accept 3 arguments: Previous object, arguments, and context.
const resolvers = {
  Date: GraphQLDate,
  Query: {
    agencies: (obj, args, context) => context.model('Agencies').find({}).cache().exec(),
    agency: (obj, { agency_key }, context) => context.model('Agencies').findOne({ agency_key }).cache().exec()
  },
  Agency: {
    routes: ({ agency_key }, args, context) => context.model('Routes').find({ agency_key }).cache(),
    stop: (_, args, context) => context.model('Stops').findOne({ stop_id: args.id }),
    agency_center: ({ agency_center }) => {
      return {
        lat: agency_center[0],
        long: agency_center[1]
      }
    },
    stops: ({ agency_key }, args, context) => context.model('Stops').find({ agency_key }).cache().exec()
  },
  Stop: { stop_times: db.getStopTimes },
  StopTime: {
    trip: ({ trip_id, agency_key }, args, context) => context.model('Trips').findOne({ trip_id, agency_key }).cache().exec()
  },
  Trip: {
    route: ({ route_id, agency_key }, args, context) => context.model('Routes').findOne({ route_id, agency_key }).cache().exec()
  }
}

const context = db.connectToDatabase
const server = new ApolloServer({ typeDefs, resolvers, context })

exports.graphqlHandler = server.createHandler({
  cors: {
    origin: '*',
    credentials: true
  }
})
