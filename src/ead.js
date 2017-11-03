const {
  success,
  failure,
  isFailable,
  isFailure,
  payload: p,
} = require('@pheasantplucker/failables')

const toFailable = v => (isFailable(v) ? v : success(v))
const payloadOf = v => (isFailable(v) ? p(v) : v)
const isPromise = v => v && v.then
const toPromise = v => (isPromise(v) ? v : Promise.resolve(v))

const process = async function(handlers, commandGenerator) {
  const cg = commandGenerator()
  let nextCommand = cg.next()
  let result
  while (!nextCommand.done) {
    const command = nextCommand.value
    const commandResult = await processCommand(handlers, command)
    if (isFailure(commandResult)) return commandResult
    result = p(commandResult)
    nextCommand = cg.next(payloadOf(result))
  }
  return toFailable(result)
}

const processCommand = async (handlers, command) => {
  const { type, payload } = command
  try {
    const handlerResult = handlers[type]({ payload })
    const promise = toPromise(handlerResult)
    const result = await promise
    if (isFailable(result) && isFailure(result)) return result
    return success(result)
  } catch (e) {
    return failure(`failed on command ${type}`)
  }
}

module.exports = {
  process,
}
