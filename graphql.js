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
  
  type Agency {
    agency_name: String
    agency_phone: String
    agency_id: ID
    agency_key: String
    agency_center: Location
    stops: [Stop]
  }

  type Stop {
    id: ID
    loc: Location
    stop_code: String
    stop_name: String
    stop_id: String
    zone_id: String
    stop_times(date: Date, routes: [Int]): [StopTime]
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
  }

  type Query {
    agencies: [Agency]
    agency(agency_key: String): Agency
    stop(id: ID!): Stop
  }
`

// Provide resolver functions for your schema fields
// Resolver functions accept 3 arguments: Previous object, arguments, and context.
const resolvers = {
  Date: GraphQLDate,
  Query: {
    agencies: (obj, args, context) => context.model('Agencies').find({}).exec(),
    agency: ({ agency_key }, args, context) => context.model('Agencies').findOne({ agency_key }).exec(),
    stop: (_, args, context) => context.model('Stops').findOne({ stop_id: args.id })
  },
  Agency: {
    agency_center: ({ agency_center }) => {
      return {
        lat: agency_center[0],
        long: agency_center[1]
      }
    },
    stops: ({ agency_key }, args, context) => context.model('Stops').find({ agency_key }).exec()
  },
  Stop: { stop_times: db.getStopTimes },
  StopTime: {
    trip: ({ trip_id, agency_key }, args, context) => context.model('Trips').findOne({ trip_id, agency_key })
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
