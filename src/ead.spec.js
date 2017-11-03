const equal = require('assert').deepEqual
const { process } = require('./ead')
const {
  assertSuccess,
  assertFailure,
  success,
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

  const things = { double, boom, flip }
  const handlers = map(prop('handler'), things)
  const commands = map(prop('command'), things)

  it('single command, simple response', () => {
    const commandGenerator = function*() {
      yield commands.double('fred')
    }
    const result = process(handlers, commandGenerator)
    assertSuccess(result, 'fredfred')
  })

  it('two unrelated commands, simple response', () => {
    const commandGenerator = function*() {
      yield commands.double('a')
      yield commands.double('b')
    }
    const result = process(handlers, commandGenerator)
    assertSuccess(result, 'bb')
  })

  it('two dependent commands, simple response', () => {
    const commandGenerator = function*() {
      const aa = yield commands.double('a')
      yield commands.double(aa)
    }
    const result = process(handlers, commandGenerator)
    assertSuccess(result, 'aaaa')
  })

  it('handles error as failable', () => {
    const commandGenerator = function*() {
      yield commands.boom()
    }
    const result = process(handlers, commandGenerator)
    assertFailure(result)
  })

  it('does not double-wrap failable results', () => {
    const commandGenerator = function*() {
      yield commands.flip('bat')
    }
    const result = process(handlers, commandGenerator)
    assertSuccess(result, 'tab')
  })
})

// Promise(Failable(result))
// de-promise everything
// en-failable everything (including try-wrap)
