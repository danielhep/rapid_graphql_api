const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'danielhep',
    password: 'temppass',
    database: 'rapid'
  }
})

const { Duration } = require('luxon')
const { createPool, createTypeParserPreset, createIntervalTypeParser } = require('slonik')
const slonik = createPool(
  'postgresql://danielhep:temppass@localhost/rapid',
  {
    typeParsers: [
      ...createTypeParserPreset(),
      {
        name: 'interval',
        parse: (value) => {
          const seconds = createIntervalTypeParser().parse(value)
          return Duration.fromMillis(seconds * 1000).shiftTo('hours', 'minutes', 'seconds', 'milliseconds')
        }
      }
    ]
  })

module.exports.slonik = slonik
module.exports.knex = knex
