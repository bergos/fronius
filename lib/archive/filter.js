function filter (observations, { start, end }) {
  return observations.filter(observation => {
    if (observation.end < start) {
      return false
    }

    if (observation.end > end) {
      return false
    }

    return true
  })
}

module.exports = filter
