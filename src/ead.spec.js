const equal = require('assert').deepEqual
const { process } = require('./ead')

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

  const cmdDouble = payload => ({ type: 'double', payload })
  const double = ({ payload }) => `${payload}${payload}`
  const handlers = { double }

  it('single command, simple response', () => {
    const commandGenerator = function*() {
      yield cmdDouble('fred')
    }
    const result = process(handlers, commandGenerator)
    equal(result, 'fredfred')
  })

  it('two unrelated commands, simple response', () => {
    const commandGenerator = function*() {
      yield cmdDouble('a')
      yield cmdDouble('b')
    }
    const result = process(handlers, commandGenerator)
    equal(result, 'bb')
  })

  it('two dependent commands, simple response', () => {
    const commandGenerator = function*() {
      const aa = yield cmdDouble('a')
      yield cmdDouble(aa)
    }
    const result = process(handlers, commandGenerator)
    equal(result, 'aaaa')
  })
})
