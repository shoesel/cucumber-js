import _ from 'lodash'

export default function(fn, proxyLength) {
  /* eslint-disable no-unused-vars */
  switch (proxyLength) {
    case 0:
      return function() {
        return fn.apply(this, _.slice(arguments))
      }
    case 1:
      return function(a) {
        return fn.apply(this, _.slice(arguments))
      }
    case 2:
      return function(a, b) {
        return fn.apply(this, _.slice(arguments))
      }
    case 3:
      return function(a, b, c) {
        return fn.apply(this, _.slice(arguments))
      }
    case 4:
      return function(a, b, c, d) {
        return fn.apply(this, _.slice(arguments))
      }
    case 5:
      return function(a, b, c, d, e) {
        return fn.apply(this, _.slice(arguments))
      }
    case 6:
      return function(a, b, c, d, e, f) {
        return fn.apply(this, _.slice(arguments))
      }
    case 7:
      return function (a, b, c, d, e, f, g) {
        return fn.apply(this, _.slice(arguments))
      }
    case 8:
      return function (a, b, c, d, e, f, g, h) {
        return fn.apply(this, _.slice(arguments))
      }
    case 9:
      return function (a, b, c, d, e, f, g, h, i) {
        return fn.apply(this, _.slice(arguments))
      }
    case 10:
      return function (a, b, c, d, e, f, g, h, i, j) {
        return fn.apply(this, _.slice(arguments))
      }
    default:
      throw new Error(`Unsupported proxy length: ${proxyLength}`)
  }
  /* eslint-enable no-unused-vars */
}
