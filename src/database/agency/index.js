exports.getAgencies = async function getAgencies (obj, args, { knex }) {
  if (obj) {
    return knex.withSchema('gtfs').select().from('agency').where({ feed_index: obj.feed_index })
  } else {
    return knex.withSchema('gtfs').select().from('agency')
  }
}

// Args: agency_id, feed_index
exports.getAgency = async function getAgency (obj, args, context) {
  return context.knex.withSchema('gtfs').select().where(args).from('agency').first()
}
