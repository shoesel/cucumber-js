import Event from './event'
import FeaturesResult from '../models/features_result'
import Promise from 'bluebird'
import ScenarioRunner from './scenario_runner'

export default class FeaturesRunner {
  constructor({eventBroadcaster, features, options, scenarioFilter, supportCodeLibrary}) {
    this.eventBroadcaster = eventBroadcaster
    this.features = features
    this.options = options
    this.scenarioFilter = scenarioFilter
    this.supportCodeLibrary = supportCodeLibrary
    this.featuresResult = new FeaturesResult(options.strict)
  }

  async run() {
    const event = new Event({data: this.features, name: Event.FEATURES_EVENT_NAME})
    await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
      await Promise.each(this.features, ::this.runFeature)
      await this.broadcastFeaturesResult()
    })
    return this.featuresResult.success
  }

  async broadcastFeaturesResult() {
    const event = new Event({data: this.featuresResult, name: Event.FEATURES_RESULT_EVENT_NAME})
    await this.eventBroadcaster.broadcastEvent(event)
  }

  async runFeature(feature) {
    if (!this.featuresResult.success && this.options.failFast) {
      return
    }
    const event = new Event({data: feature, name: Event.FEATURE_EVENT_NAME})
    await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
      await Promise.each(feature.scenarios, ::this.runScenario)
    })
  }

  async runScenario(scenario) {
    if (!this.featuresResult.success && this.options.failFast) {
      return
    }
    if (!this.scenarioFilter.matches(scenario)) {
      return
    }
    const scenarioRunner = new ScenarioRunner({
      eventBroadcaster: this.eventBroadcaster,
      options: this.options,
      scenario,
      supportCodeLibrary: this.supportCodeLibrary
    })
    const scenarioResult = await scenarioRunner.run()
    this.featuresResult.witnessScenarioResult(scenarioResult)
  }
}
