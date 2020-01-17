exports.getStops = function (obj, args, { knex }) {
  return knex.withSchema('gtfs').select().from('stops').where({ feed_index: obj.feed_index })
}

// Args: stop_id
// Obj: feed_index, 
exports.getStop = async function getStop (obj, args, context) {
  return context.knex.withSchema('gtfs').select().where({...args, feed_index: obj.feed_index}).from('stops').first()
}

// args: routes, date
// obj: stop 
exports.getStopTimes = async function getStopTimes (obj, args, context) {
  const where = {
    stop_id: obj.stop_id,
    feed_index: obj.feed_index
  }

  return context.knex.withSchema('gtfs').select().where(where).from('stop_times')
}