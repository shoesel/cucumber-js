import Promise from 'bluebird'
import UncaughtExceptionManager from './uncaught_exception_manager'
import util from 'util'
import Time from './time'

export default class UserCodeRunner {
  static async run ({argsArray, thisArg, fn, timeoutInMilliseconds}) {
    const callbackDeferred = Promise.defer()
    argsArray.push(function(error, result) {
      if (error) {
        callbackDeferred.reject(error)
      } else {
        callbackDeferred.resolve(result)
      }
    })

    let fnReturn
    try {
      fnReturn = fn.apply(thisArg, argsArray)
    } catch (e) {
      const error = (e instanceof Error) ? e : util.format(e)
      return {error}
    }

    const racingPromises = []
    const callbackInterface = fn.length === argsArray.length
    const promiseInterface = fnReturn && typeof fnReturn.then === 'function'

    if (callbackInterface && promiseInterface) {
      return {error: 'function uses multiple asynchronous interfaces: callback and promise'}
    } else if (callbackInterface) {
      racingPromises.push(callbackDeferred.promise)
    } else if (promiseInterface) {
      racingPromises.push(fnReturn)
    } else {
      return {result: fnReturn}
    }

    const uncaughtExceptionDeferred = Promise.defer()
    const exceptionHandler = function(err) {
      uncaughtExceptionDeferred.reject(err)
    }
    UncaughtExceptionManager.registerHandler(exceptionHandler)
    racingPromises.push(uncaughtExceptionDeferred.promise)

    const timeoutDeferred = Promise.defer()
    Time.setTimeout(function() {
      const timeoutMessage = 'function timed out after ' + timeoutInMilliseconds + ' milliseconds'
      timeoutDeferred.reject(new Error(timeoutMessage))
    }, timeoutInMilliseconds)
    racingPromises.push(timeoutDeferred.promise)

    let error, result
    try {
      result = await Promise.race(racingPromises)
    } catch (e) {
      if ((e instanceof Error)) {
        error = e
      } else if (e) {
        error = util.format(e)
      } else {
        error = 'Promise rejected without a reason'
      }
    }

    UncaughtExceptionManager.unregisterHandler(exceptionHandler)

    return {error, result}
  }
}
