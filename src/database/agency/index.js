exports.getAgencies = async function getAgencies (obj, args, context) {
  const returnval = context.knex.withSchema('gtfs').select().from('agency')
  return returnval
}

exports.getAgency = async function getAgency (obj, args, context) {
  return context.knex.withSchema('gtfs').select().where(args).from('agency').first()
}
