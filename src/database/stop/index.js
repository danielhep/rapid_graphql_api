exports.getStops = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('stops').where({ feed_index: obj.feed_index )
}
