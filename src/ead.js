const process = function(handlers, commandGenerator) {
  const { type, payload } = commandGenerator().next().value
  return handlers[type]({ payload })
}

module.exports = {
  process,
}
