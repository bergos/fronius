function buildResponse ({ content = {}, error } = {}) {
  const response = {
    Head: {
      Status: {
        Code: 0
      }
    },
    Body: content
  }

  if (error) {
    response.Head.Status.Code = 255
    response.Head.Status.Reason = error
  }

  return response
}

function throughJson (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  buildResponse,
  throughJson
}
