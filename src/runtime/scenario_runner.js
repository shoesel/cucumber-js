import Event from './event'
import Hook from '../models/hook'
import Promise from 'bluebird'
import ScenarioResult from '../models/scenario_result'
import Status from '../status'
import StepResult from '../models/step_result'


export default class ScenarioRunner {
  constructor({eventBroadcaster, options, scenario, supportCodeLibrary}) {
    this.eventBroadcaster = eventBroadcaster
    this.options = options
    this.scenario = scenario
    this.supportCodeLibrary = supportCodeLibrary

    this.defaultTimeout = supportCodeLibrary.getDefaultTimeout()
    this.scenarioResult = new ScenarioResult(scenario)
    this.transformLookup = supportCodeLibrary.getTransformLookup()
    this.world = supportCodeLibrary.instantiateNewWorld(options.worldParameters)
  }

  async broadcastScenarioResult() {
    const event = new Event({data: this.scenarioResult, name: Event.SCENARIO_RESULT_EVENT_NAME})
    await this.eventBroadcaster.broadcastEvent(event)
  }

  async broadcastStepResult(stepResult) {
    this.scenarioResult.witnessStepResult(stepResult)
    const event = new Event({data: stepResult, name: Event.STEP_RESULT_EVENT_NAME})
    await this.eventBroadcaster.broadcastEvent(event)
  }

  isSkippingSteps() {
    return this.scenarioResult.status !== Status.PASSED
  }

  async processHook(hook, hookDefinition) {
    if (this.options.dryRun) {
      return new StepResult({
        step: hook,
        stepDefinition: hookDefinition,
        status: Status.SKIPPED
      })
    } else {
      return await hookDefinition.invoke({
        defaultTimeout: this.defaultTimeout,
        scenarioResult: this.scenarioResult,
        step: hook,
        transformLookup: this.transformLookup,
        world: this.world
      })
    }
  }

  async processStep(step) {
    const stepDefinitions = this.supportCodeLibrary.getStepDefinitions(step.name)
    if (stepDefinitions.length === 0) {
      return new StepResult({
        step,
        status: Status.UNDEFINED
      })
    } else if (stepDefinitions.length > 1) {
      return new StepResult({
        ambiguousStepDefinitions: stepDefinitions,
        step,
        status: Status.AMBIGUOUS
      })
    } else if (this.options.dryRun || this.isSkippingSteps()) {
      return new StepResult({
        step,
        stepDefinition: stepDefinitions[0],
        status: Status.SKIPPED
      })
    } else {
      return await stepDefinitions[0].invoke({
        defaultTimeout: this.defaultTimeout,
        scenarioResult: this.scenarioResult,
        step,
        transformLookup: this.transformLookup,
        world: this.world
      })
    }
  }

  async run() {
    const event = new Event({data: this.scenario, name: Event.SCENARIO_EVENT_NAME})
    await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
      await this.runBeforeHooks()
      await this.runSteps()
      await this.runAfterHooks()
      await this.broadcastScenarioResult()
    })
    return this.scenarioResult
  }

  async runHooks({hookDefinitions, hookKeyword}) {
    await Promise.each(hookDefinitions, async (hookDefinition) => {
      const hook = new Hook({keyword: hookKeyword, scenario: this.scenario})
      const event = new Event({data: hook, name: Event.STEP_EVENT_NAME})
      await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
        const stepResult = await this.processHook(hook, hookDefinition)
        await this.broadcastStepResult(stepResult)
      })
    })
  }

  async runAfterHooks() {
    await this.runHooks({
      hookDefinitions: this.supportCodeLibrary.getAfterHookDefinitions(this.scenario),
      hookKeyword: Hook.AFTER_STEP_KEYWORD
    })
  }

  async runBeforeHooks() {
    await this.runHooks({
      hookDefinitions: this.supportCodeLibrary.getBeforeHookDefinitions(this.scenario),
      hookKeyword: Hook.BEFORE_STEP_KEYWORD
    })
  }

  async runSteps() {
    await Promise.each(this.scenario.steps, async(step) => {
      const event = new Event({data: step, name: Event.STEP_EVENT_NAME})
      await this.eventBroadcaster.broadcastAroundEvent(event, async() => {
        await Promise.resolve() // synonymous to process.nextTick / setImmediate
        const stepResult = await this.processStep(step)
        await this.broadcastStepResult(stepResult)
      })
    })
  }
}
