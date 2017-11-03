const { success, failure, isFailable } = require('@pheasantplucker/failables')

const asFailable = v => (isFailable(v) ? v : success(v))

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
    nextResult = cg.next(result)
  }
  return asFailable(result)
}

module.exports = {
  process,
}
