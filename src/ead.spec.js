const equal = require('assert').deepEqual
const { process } = require('./ead')
const {
  assertSuccess,
  assertFailure,
  success,
  failure,
  hydrate,
} = require('@pheasantplucker/failables')
const { prop, map, reverse } = require('ramda')

describe('ead.js', () => {
  describe('generator playground', () => {
    function* numbers() {
      yield 1
      yield 2
      yield 3
    }

    it('should sum to 6', () => {
      let sum = 0
      for (let n of numbers()) sum += n
      equal(sum, 6)
    })

    it('first value should be 1', () => {
      equal(numbers().next().value, 1)
    })

    it('final value should be 3', () => {
      const x = numbers()
      let value
      let result = {}
      while (!result.done) {
        value = result.value
        result = x.next()
      }
      equal(value, 3)
    })
  })

  const double = {
    command: payload => ({ type: 'double', payload }),
    handler: ({ payload }) => `${payload}${payload}`,
  }

  const flip = {
    command: payload => ({ type: 'flip', payload }),
    handler: ({ payload }) => success(reverse(payload)),
  }

  const boom = {
    command: () => ({ type: 'boom' }),
    handler: () => {
      throw new Error()
    },
  }

  const fail = {
    command: () => ({ type: 'fail' }),
    handler: () => failure('handler failed'),
  }

  const later = {
    command: payload => ({ type: 'later', payload }),
    handler: ({ payload }) => Promise.resolve(payload.length),
    // handler: ({ payload }) => payload.length,
  }

  const things = { double, boom, flip, fail, later }
  const handlers = map(prop('handler'), things)
  const commands = map(prop('command'), things)

  it('single command, simple response', async () => {
    const commandGenerator = function*() {
      yield commands.double('fred')
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 'fredfred')
  })

  it('two unrelated commands, simple response', async () => {
    const commandGenerator = function*() {
      yield commands.double('a')
      yield commands.double('b')
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 'bb')
  })

  it('two dependent commands, simple response', async () => {
    const commandGenerator = function*() {
      const aa = yield commands.double('a')
      yield commands.double(aa)
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 'aaaa')
  })

  it('handles error as failable', async () => {
    const commandGenerator = function*() {
      yield commands.boom()
    }
    const result = await process(handlers, commandGenerator)
    assertFailure(result)
  })

  it('does not double-wrap failable results', async () => {
    const commandGenerator = function*() {
      yield commands.flip('bat')
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 'tab')
  })

  it('unwraps intermediate failables', async () => {
    const commandGenerator = function*() {
      const tab = yield commands.flip('bat')
      yield commands.double(tab)
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 'tabtab')
  })

  it('returns first failure', async () => {
    const commandGenerator = function*() {
      yield commands.fail()
      yield commands.flip('zot')
    }
    const result = await process(handlers, commandGenerator)
    assertFailure(result, 'handler failed')
  })

  it('resolves promises', async () => {
    const commandGenerator = function*() {
      const zotzot = yield commands.double('zot')
      yield commands.later(zotzot)
    }
    const result = await process(handlers, commandGenerator)
    assertSuccess(result, 6)
  })
})
