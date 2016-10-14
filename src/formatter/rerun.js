import _ from 'lodash'
import Formatter from './'
import path from 'path'
import Status from '../status'


const RERUN_STATUSES = [
  Status.AMBIGUOUS,
  Status.FAILED,
  Status.PENDING,
  Status.UNDEFINED
]


export default class RerunFormatter extends Formatter {
  constructor(options) {
    super(options)
    this.scenarios = {}
  }

  handleScenarioResult(scenarioResult) {
    if (_.includes(RERUN_STATUSES, scenarioResult.status)) {
      const scenario = scenarioResult.scenario
      const uri = path.relative(this.cwd, scenario.uri)
      if (!this.scenarios[uri]) {
        this.scenarios[uri] = []
      }
      this.scenarios[uri].push(scenario.line)
    }
  }

  handleAfterFeatures() {
    const text = _.map(this.scenarios, (lines, uri) => {
      return uri + ':' + lines.join(':')
    }).join('\n')
    this.log(text)
  }
}
