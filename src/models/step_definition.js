import _ from 'lodash'
import AttachmentManager from '../attachment_manager'
import DataTable from './step_arguments/data_table'
import DocString from './step_arguments/doc_string'
import Status from '../status'
import StepResult from './step_result'
import Time from '../time'
import UserCodeRunner from '../user_code_runner'
import {CucumberExpression, RegularExpression} from 'cucumber-expressions'

const {beginTiming, endTiming} = Time

export default class StepDefinition {
  constructor({code, line, options, pattern, uri}) {
    this.code = code
    this.line = line
    this.options = options
    this.pattern = pattern
    this.uri = uri
  }

  buildInvalidCodeLengthMessage(syncOrPromiseLength, callbackLength) {
    return 'function has ' + this.code.length + ' arguments' +
      ', should have ' + syncOrPromiseLength + ' (if synchronous or returning a promise)' +
      ' or '  + callbackLength + ' (if accepting a callback)'
  }

  getInvalidCodeLengthMessage(parameters) {
    return this.buildInvalidCodeLengthMessage(parameters.length, parameters.length + 1)
  }

  getInvocationParameters({step, transformLookup}) {
    const cucumberExpression = this.getCucumberExpression(transformLookup)
    const stepNameParameters = _.map(cucumberExpression.match(step.name), 'transformedValue')
    const stepArgumentParameters = step.arguments.map(function(arg) {
      if (arg instanceof DataTable) {
        return arg
      } else if (arg instanceof DocString) {
        return arg.content
      } else {
        throw new Error('Unknown argument type:' + arg)
      }
    })
    return stepNameParameters.concat(stepArgumentParameters)
  }

  getCucumberExpression (transformLookup) {
    if (typeof(this.pattern) === 'string') {
      return new CucumberExpression(this.pattern, [], transformLookup)
    } else {
      return new RegularExpression(this.pattern, [], transformLookup)
    }
  }

  getValidCodeLengths (parameters) {
    return [parameters.length, parameters.length + 1]
  }

  async invoke({defaultTimeout, scenarioResult, step, transformLookup, world}) {
    beginTiming()
    const parameters = this.getInvocationParameters({scenarioResult, step, transformLookup})
    const timeoutInMilliseconds = this.options.timeout || defaultTimeout
    const attachmentManager = new AttachmentManager()
    world.attach = ::attachmentManager.create

    let validCodeLengths = this.getValidCodeLengths(parameters)
    let error, result
    if (validCodeLengths.indexOf(this.code.length) === -1) {
      error = this.getInvalidCodeLengthMessage(parameters)
    } else {
      const data = await UserCodeRunner.run({
        argsArray: parameters,
        fn: this.code,
        thisArg: world,
        timeoutInMilliseconds
      })
      error = data.error
      result = data.result
    }

    const stepResultData = {
      attachments: attachmentManager.getAll(),
      duration: endTiming(),
      step,
      stepDefinition: this
    }

    if (result === 'pending') {
      stepResultData.status = Status.PENDING
    } else if (error) {
      stepResultData.failureException = error
      stepResultData.status = Status.FAILED
    } else {
      stepResultData.status = Status.PASSED
    }

    return new StepResult(stepResultData)
  }

  matchesStepName({stepName, transformLookup}) {
    const cucumberExpression = this.getCucumberExpression(transformLookup)
    return Boolean(cucumberExpression.match(stepName))
  }
}
