import UserCodeRunner from '../user_code_runner'
import path from 'path'

export default class Listener {
  constructor({cwd, line, supportCodeLibrary, timeout, uri}) {
    this.cwd = cwd
    this.line = line
    this.timeout = timeout
    this.supportCodeLibrary = supportCodeLibrary
    this.uri = uri
  }

  getHandlerForEvent(event) {
    return this['handle' + event.name]
  }

  async hear(event, defaultTimeout) {
    const handler = this.getHandlerForEvent(event)
    if (handler) {
      const timeout = this.timeout || defaultTimeout
      const {error} = await UserCodeRunner.run({
        argsArray: [event.data],
        fn: handler,
        timeoutInMilliseconds: timeout,
        thisArg: this
      })
      if (error) {
        throw this.prependLocationToError(error)
      }
    }
  }

  prependLocationToError(error) {
    if (error && this.uri) {
      const ref = path.relative(this.cwd, this.uri) + ':' + this.line
      if (error instanceof Error) {
        error.message = ref + ' ' + error.message
      } else {
        error = ref + ' ' + error
      }
    }
    return error
  }

  setHandlerForEventName(eventName, handler) {
    this['handle' + eventName] = handler
  }
}
