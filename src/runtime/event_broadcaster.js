import path from 'path'
import Promise from 'bluebird'
import UserCodeRunner from '../user_code_runner'

export default class EventBroadcaster {
  constructor({cwd, listenerDefaultTimeout, listeners}) {
    this.cwd = cwd
    this.listenerDefaultTimeout = listenerDefaultTimeout
    this.listeners = listeners
  }

  async broadcastAroundEvent(event, fn) {
    await this.broadcastEvent(event.buildBeforeEvent())
    await fn()
    await this.broadcastEvent(event.buildAfterEvent())
  }

  async broadcastEvent(event) {
    await Promise.each(this.listeners, async(listener) => {
      const handler = listener['handle' + event.name]
      if (handler) {
        const timeout = listener.timeout || this.listenerDefaultTimeout
        const {error} = await UserCodeRunner.run({
          argsArray: [event.data],
          fn: handler,
          timeoutInMilliseconds: timeout,
          thisArg: listener
        })
        if (error) {
          throw this.prependLocationToError(error, listener)
        }
      }
    })
  }

  prependLocationToError(error, listener) {
    if (listener.cwd && listener.uri) {
      const ref = path.relative(listener.cwd, listener.uri) + ':' + listener.line
      if (error instanceof Error) {
        error.message = ref + ' ' + error.message
      } else {
        error = ref + ' ' + error
      }
    }
    return error
  }
}
