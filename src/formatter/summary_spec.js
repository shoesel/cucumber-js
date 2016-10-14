import getColorFns from './get_color_fns'
import Status, {getStatusMapping} from '../status'
import SummaryFormatter from './summary'

describe('SummaryFormatter', function() {
  beforeEach(function() {
    this.output = ''
    const logFn = (data) => {
      this.output += data
    }
    const colorFns = getColorFns(false)
    this.featuresResult = {
      scenarioCounts: getStatusMapping(0),
      stepCounts: getStatusMapping(0),
      duration: 0
    }
    const snippetBuilder = createMock({build: 'snippet'})
    this.summaryFormatter = new SummaryFormatter({
      colorFns,
      cwd: 'path/to/project',
      log: logFn,
      snippetBuilder
    })
  })

  describe('issues', function() {
    beforeEach(function() {
      const scenario = {
        line: 1,
        name: 'name1',
        uri: 'path/to/project/a.feature'
      }
      this.step = {
        keyword: 'keyword ',
        line: 2,
        name: 'name2',
        scenario,
        uri: 'path/to/project/a.feature'
      }
    })

    describe('with a failing step', function() {
      beforeEach(function() {
        const stepDefinition = {
          line: 3,
          uri: 'path/to/project/steps.js',
        }
        const stepResult = {
          duration: 0,
          failureException: 'error',
          status: Status.FAILED,
          step: this.step,
          stepDefinition
        }
        this.summaryFormatter.handleStepResult(stepResult)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('logs the issue', function() {
        expect(this.output).to.contain(
          'Failures:\n' +
          '\n' +
          '1) Scenario: name1 - a.feature:1\n' +
          '   Step: keyword name2 - a.feature:2\n' +
          '   Step Definition: steps.js:3\n' +
          '   Message:\n' +
          '     error'
        )
      })
    })

    describe('with an ambiguous step', function() {
      beforeEach(function() {
        const stepDefinition1 = {
          line: 3,
          pattern: 'pattern1',
          uri: 'path/to/project/steps.js'
        }
        const stepDefinition2 = {
          line: 4,
          pattern: 'longer pattern2',
          uri: 'path/to/project/steps.js'
        }
        const stepResult = {
          ambiguousStepDefinitions: [stepDefinition1, stepDefinition2],
          duration: 0,
          status: Status.AMBIGUOUS,
          step: this.step
        }
        this.summaryFormatter.handleStepResult(stepResult)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('logs the issue', function() {
        expect(this.output).to.contain(
          'Failures:\n' +
          '\n' +
          '1) Scenario: name1 - a.feature:1\n' +
          '   Step: keyword name2 - a.feature:2\n' +
          '   Message:\n' +
          '     Multiple step definitions match:\n' +
          '       pattern1        - steps.js:3\n' +
          '       longer pattern2 - steps.js:4'
        )
      })
    })

    describe('with an undefined step', function() {
      beforeEach(function() {
        const stepResult = {
          duration: 0,
          status: Status.UNDEFINED,
          step: this.step
        }
        this.summaryFormatter.handleStepResult(stepResult)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('logs the issue', function() {
        expect(this.output).to.contain(
          'Warnings:\n' +
          '\n' +
          '1) Scenario: name1 - a.feature:1\n' +
          '   Step: keyword name2 - a.feature:2\n' +
          '   Message:\n' +
          '     Undefined. Implement with the following snippet:\n' +
          '\n' +
          '       snippet'
        )
      })
    })

    describe('with a pending step', function() {
      beforeEach(function() {
        const stepResult = {
          duration: 0,
          status: Status.PENDING,
          step: this.step
        }
        this.summaryFormatter.handleStepResult(stepResult)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('logs the issue', function() {
        expect(this.output).to.contain(
          'Warnings:\n' +
          '\n' +
          '1) Scenario: name1 - a.feature:1\n' +
          '   Step: keyword name2 - a.feature:2\n' +
          '   Message:\n' +
          '     Pending'
        )
      })
    })
  })

  describe('summary', function() {
    describe('with no features', function() {
      beforeEach(function() {
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '0 steps\n' +
          '0m00.000s\n'
        )
      })
    })

    describe('with one passing scenario', function() {
      beforeEach(function() {
        this.featuresResult.scenarioCounts[Status.PASSED] = 1
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '1 scenario (1 passed)\n' +
          '0 steps\n' +
          '0m00.000s\n'
        )
      })
    })

    describe('with one of every kind of scenario', function() {
      beforeEach(function() {
        this.featuresResult.scenarioCounts = getStatusMapping(1)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '6 scenarios (1 failed, 1 ambiguous, 1 undefined, 1 pending, 1 skipped, 1 passed)\n' +
          '0 steps\n' +
          '0m00.000s\n'
        )
      })
    })

    describe('with one passing step', function() {
      beforeEach(function() {
        this.featuresResult.stepCounts[Status.PASSED] = 1
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '1 step (1 passed)\n' +
          '0m00.000s\n'
        )
      })
    })

    describe('with one of every kind of setp', function() {
      beforeEach(function() {
        this.featuresResult.stepCounts = getStatusMapping(1)
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '6 steps (1 failed, 1 ambiguous, 1 undefined, 1 pending, 1 skipped, 1 passed)\n' +
          '0m00.000s\n'
        )
      })
    })

    describe('with a duration of 123 milliseconds', function() {
      beforeEach(function() {
        this.featuresResult.duration = 123
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '0 steps\n' +
          '0m00.123s\n'
        )
      })
    })

    describe('with a duration of 12.3 seconds', function() {
      beforeEach(function() {
        this.featuresResult.duration = 123 * 100
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '0 steps\n' +
          '0m12.300s\n'
        )
      })
    })

    describe('with a duration of 120.3 seconds', function() {
      beforeEach(function() {
        this.featuresResult.duration = 123 * 1000
        this.summaryFormatter.handleFeaturesResult(this.featuresResult)
      })

      it('outputs step totals, scenario totals, and duration', function() {
        expect(this.output).to.contain(
          '0 scenarios\n' +
          '0 steps\n' +
          '2m03.000s\n'
        )
      })
    })
  })
})
