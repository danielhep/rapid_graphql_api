exports.getRouteFromTrip = function (obj, args, { knex }) {
  const where = {
    route_id: obj.route_id,
    feed_index: obj.feed_index
  }

  return knex.withSchema('gtfs').select().where(where).from('routes').first()
}
