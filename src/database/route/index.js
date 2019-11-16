exports.getRoutes = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('routes').where({ agency_id: obj.agency_id })
}
