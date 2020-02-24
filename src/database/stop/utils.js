const { Duration } = require('luxon')

exports.getTimeFromDuration = (objectKey) => function (obj, args, context) {
  if (Duration.isDuration(obj[objectKey])) {
    const dur = obj[objectKey]
    return dur.toFormat('hh:mm:ss')
  } else {
    return obj[objectKey]
  }
}
