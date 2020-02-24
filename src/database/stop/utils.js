const { Duration } = require('luxon')

exports.getTimeFromInterval = (objectKey) => function (obj, args, context) {
  const dur = obj[objectKey]
  return dur.toFormat('hh:mm:ss')
}
