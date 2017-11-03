const process = function(handlers, commandGenerator) {
  const cg = commandGenerator()
  let nextResult = cg.next()
  let result
  while (!nextResult.done) {
    const value = nextResult.value
    const { type, payload } = value
    result = handlers[type]({ payload })
    nextResult = cg.next(result)
  }
  return result
}

module.exports = {
  process,
}
