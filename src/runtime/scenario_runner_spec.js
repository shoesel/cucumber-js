import {expectToHearEvents} from '../../spec/listener_helpers'
import EventBroadcaster from './event_broadcaster'
import HookDefinition from '../models/hook_definition'
import Promise from 'bluebird'
import ScenarioRunner from './scenario_runner'
import Status from '../status'

describe('ScenarioRunner', function () {
  beforeEach(function () {
    this.listener = createMock(['hear'])
    this.eventBroadcaster = new EventBroadcaster({listeners: [this.listener]})
    this.scenario = createMock({
      getFeature: null,
      getSteps: []
    })
    this.supportCodeLibrary = createMock({
      getAfterHookDefinitions: [],
      getBeforeHookDefinitions: [],
      getDefaultTimeout: 5000,
      getStepDefinitions: [],
      getTransformLookup: {},
      instantiateNewWorld: {}
    })
    this.options = {}
    this.scenarioRunner = new ScenarioRunner({
      eventBroadcaster: this.eventBroadcaster,
      options: this.options,
      scenario: this.scenario,
      supportCodeLibrary: this.supportCodeLibrary
    })
  })

  describe('run()', function () {
    describe('with no steps or hooks', function() {
      beforeEach(async function() {
        this.supportCodeLibrary.getAfterHookDefinitions.returns([])
        this.supportCodeLibrary.getBeforeHookDefinitions.returns([])
        this.scenario.steps = []
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts a scenario event', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a passing result', function() {
        expect(this.scenarioResult.status).to.eql(Status.PASSED)
      })
    })

    describe('with a passing step', function() {
      beforeEach(async function() {
        this.step = {}
        this.stepResult = {
          duration: 1,
          status: Status.PASSED,
          step: this.step
        }
        const stepDefinition = createMock({
          invoke: Promise.resolve(this.stepResult)
        })
        this.supportCodeLibrary.getStepDefinitions.returns([stepDefinition])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts a scenario, step, stepResult and scenarioResult event', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', this.stepResult],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a passing result', function() {
        expect(this.scenarioResult.status).to.eql(Status.PASSED)
      })
    })

    describe('with a failing step', function() {
      beforeEach(async function() {
        this.step = {}
        this.stepResult = {
          duration: 1,
          status: Status.FAILED,
          step: this.step
        }
        const stepDefinition = createMock({
          invoke: Promise.resolve(this.stepResult)
        })
        this.supportCodeLibrary.getStepDefinitions.returns([stepDefinition])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts a scenario, step and stepResult event', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', this.stepResult],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a failed result', function() {
        expect(this.scenarioResult.status).to.eql(Status.FAILED)
      })
    })

    describe('with an ambiguous step', function() {
      beforeEach(async function() {
        this.step = {}
        this.supportCodeLibrary.getStepDefinitions.returns([{}, {}])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts the expected events', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.AMBIGUOUS)
          }],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a failed result', function() {
        expect(this.scenarioResult.status).to.eql(Status.AMBIGUOUS)
      })
    })

    describe('with an undefined step', function() {
      beforeEach(async function() {
        this.step = {}
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts the expected events', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.UNDEFINED)
          }],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a failed result', function() {
        expect(this.scenarioResult.status).to.eql(Status.UNDEFINED)
      })
    })

    describe('with a step in dry run mode', function() {
      beforeEach(async function() {
        this.options.dryRun = true
        this.step = {}
        this.supportCodeLibrary.getStepDefinitions.returns([{}])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts the expected events', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.SKIPPED)
          }],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a skipped result', function() {
        expect(this.scenarioResult.status).to.eql(Status.SKIPPED)
      })
    })

    describe('with an before hook and step in dry run mode', function() {
      beforeEach(async function() {
        this.options.dryRun = true
        this.hookDefinition = new HookDefinition({
          code() { throw new Error('error') },
          options: {}
        })
        this.step = {}
        this.stepDefinition = {}
        this.supportCodeLibrary.getBeforeHookDefinitions.returns([this.hookDefinition])
        this.supportCodeLibrary.getStepDefinitions.returns([{}])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts the expected events', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', function(step) {
            expect(step.keyword).to.eql('Before ')
          }],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.SKIPPED)
          }],
          ['AfterStep', function(step) {
            expect(step.keyword).to.eql('Before ')
          }],
          ['BeforeStep', this.step],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.SKIPPED)
          }],
          ['AfterStep', this.step],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a skipped result', function() {
        expect(this.scenarioResult.status).to.eql(Status.SKIPPED)
      })
    })

    describe('with an after hook and step in dry run mode', function() {
      beforeEach(async function() {
        this.options.dryRun = true
        this.hookDefinition = new HookDefinition({
          code() { throw new Error('error') },
          options: {}
        })
        this.step = {}
        this.stepDefinition = {}
        this.supportCodeLibrary.getAfterHookDefinitions.returns([this.hookDefinition])
        this.supportCodeLibrary.getStepDefinitions.returns([{}])
        this.scenario.steps = [this.step]
        this.scenarioResult = await this.scenarioRunner.run()
      })

      it('broadcasts the expected events', function() {
        expectToHearEvents(this.listener.hear, [
          ['BeforeScenario', this.scenario],
          ['BeforeStep', this.step],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.SKIPPED)
          }],
          ['AfterStep', this.step],
          ['BeforeStep', function(step) {
            expect(step.keyword).to.eql('After ')
          }],
          ['StepResult', function(stepResult) {
            expect(stepResult.status).to.eql(Status.SKIPPED)
          }],
          ['AfterStep', function(step) {
            expect(step.keyword).to.eql('After ')
          }],
          ['ScenarioResult', this.scenarioResult],
          ['AfterScenario', this.scenario]
        ])
      })

      it('returns a skipped result', function() {
        expect(this.scenarioResult.status).to.eql(Status.SKIPPED)
      })
    })
  })
})
