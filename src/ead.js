const {
  success,
  failure,
  isFailable,
  payload: p,
} = require('@pheasantplucker/failables')

const asFailable = v => (isFailable(v) ? v : success(v))
const payloadOf = v => (isFailable(v) ? p(v) : v)

const process = function(handlers, commandGenerator) {
  const cg = commandGenerator()
  let nextResult = cg.next()
  let result
  while (!nextResult.done) {
    const value = nextResult.value
    const { type, payload } = value
    try {
      result = handlers[type]({ payload })
    } catch (e) {
      return failure(`failed on command ${type}`)
    }
    nextResult = cg.next(payloadOf(result))
  }
  return asFailable(result)
}

module.exports = {
  process,
}
