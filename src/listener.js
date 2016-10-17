export default class Listener {
  constructor({cwd, line, timeout, uri}) {
    this.cwd = cwd
    this.line = line
    this.timeout = timeout
    this.uri = uri
  }
}
