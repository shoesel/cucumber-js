import Listener from '../listener'

export default class Formatter extends Listener {
  constructor(options) {
    super(options)
    this.log = options.log
    this.colorFns = options.colorFns
    this.snippetBuilder = options.snippetBuilder
  }
}
