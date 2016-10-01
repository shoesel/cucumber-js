import _ from 'lodash'

export default class SupportCodeLibrary {
  constructor(options) {
    _.assign(this, _.pick(options, [
      'afterHookDefinitions',
      'beforeHookDefinitions',
      'defaultTimeout',
      'listeners',
      'stepDefinitions',
      'transformLookup',
      'World'
    ]))
  }

  getDefaultTimeout() {
    return this.defaultTimeout
  }

  getListeners() {
    return this.listeners
  }

  getTransformLookup() {
    return this.transformLookup
  }

  getAfterHookDefinitions(scenario) {
    return this.getHookDefinitions(this.afterHookDefinitions, scenario)
  }

  getBeforeHookDefinitions(scenario) {
    return this.getHookDefinitions(this.beforeHookDefinitions, scenario)
  }

  getHookDefinitions(hookDefinitions, scenario) {
    return hookDefinitions.filter((hookDefinition) => {
      return hookDefinition.appliesToScenario(scenario)
    })
  }

  getStepDefinitions(stepName) {
    return this.stepDefinitions.filter((stepDefinition) => {
      return stepDefinition.matchesStepName({stepName, transformLookup: this.transformLookup})
    })
  }

  instantiateNewWorld(parameters) {
    return new this.World(parameters)
  }
}
