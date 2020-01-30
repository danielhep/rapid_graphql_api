exports.getRoutes = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('routes').where({ feed_index: obj.feed_index })
}
