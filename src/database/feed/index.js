exports.getFeeds = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('feed_info')
}

exports.getFeed = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('feed_info').where(args).first()
}
