import _ from 'lodash'
import RerunFormatter from './rerun'
import Status from '../../status'

describe('RerunFormatter', function() {
  beforeEach(function() {
    this.output = ''
    const logFn = (data) => {
      this.output += data
    }
    this.rerunFormatter = new RerunFormatter({
      cwd: 'path/to/project',
      log: logFn
    })
  })

  describe('with no scenarios', function() {
    beforeEach(function() {
      this.rerunFormatter.handleAfterFeatures()
    })

    it('outputs nothing', function() {
      expect(this.output).to.eql('')
    })
  })

  _.each([Status.PASSED, Status.SKIPPED], (status) => {
    describe('with one ' + status + ' scenario', function() {
      beforeEach(function() {
        const scenarioResult = {status}
        this.rerunFormatter.handleScenarioResult(scenarioResult)
        this.rerunFormatter.handleAfterFeatures()
      })

      it('outputs nothing', function() {
        expect(this.output).to.eql('')
      })
    })
  })

  _.each([Status.AMBIGUOUS, Status.FAILED, Status.PENDING, Status.UNDEFINED], (status) => {
    describe('with one ' + status + ' scenario', function() {
      beforeEach(function() {
        const scenario = {
          line: 1,
          uri: 'path/to/project/features/a.feature'
        }
        const scenarioResult = {
          scenario,
          status
        }
        this.rerunFormatter.handleScenarioResult(scenarioResult)
        this.rerunFormatter.handleAfterFeatures()
      })

      it('outputs the reference needed to run the scenario again', function() {
        expect(this.output).to.eql('features/a.feature:1')
      })
    })
  })

  describe('with two failing scenarios in the same file', function() {
    beforeEach(function() {
      const scenario1 = {
        line: 1,
        uri: 'path/to/project/features/a.feature'
      }
      const scenarioResult1 = {
        scenario: scenario1,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult1)
      const scenario2 = {
        line: 2,
        uri: 'path/to/project/features/a.feature'
      }
      const scenarioResult2 = {
        scenario: scenario2,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult2)
      this.rerunFormatter.handleAfterFeatures()
    })

    it('outputs the reference needed to run the scenarios again', function() {
      expect(this.output).to.eql('features/a.feature:1:2')
    })
  })

  describe('with two failing scenarios in different files', function() {
    beforeEach(function() {
      const scenario1 = {
        line: 1,
        uri: 'path/to/project/features/a.feature'
      }
      const scenarioResult1 = {
        scenario: scenario1,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult1)
      const scenario2 = {
        line: 2,
        uri: 'path/to/project/features/b.feature'
      }
      const scenarioResult2 = {
        scenario: scenario2,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult2)
      this.rerunFormatter.handleAfterFeatures()
    })

    it('outputs the references needed to run the scenarios again', function() {
      expect(this.output).to.eql(
        'features/a.feature:1\n' +
        'features/b.feature:2'
      )
    })
  })
})
