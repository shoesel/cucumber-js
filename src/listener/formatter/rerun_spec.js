import _ from 'lodash'
import RerunFormatter from './rerun'
import Status from '../../status'
import path from 'path'

describe('RerunFormatter', function() {
  beforeEach(function() {
    this.output = ''
    const logFn = (data) => {
      this.output += data
    }
    this.projectPath = path.resolve('path', 'to', 'project')
    this.feature1RelativePath = path.join('features', 'a.feature')
    this.feature1Path = path.join(this.projectPath, this.feature1RelativePath)
    this.feature2RelativePath = path.join('features', 'b.feature')
    this.feature2Path = path.join(this.projectPath, this.feature2RelativePath)
    this.rerunFormatter = new RerunFormatter({
      cwd: this.projectPath,
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
          uri: this.feature1Path
        }
        const scenarioResult = {
          scenario,
          status
        }
        this.rerunFormatter.handleScenarioResult(scenarioResult)
        this.rerunFormatter.handleAfterFeatures()
      })

      it('outputs the reference needed to run the scenario again', function() {
        expect(this.output).to.eql(`${this.feature1RelativePath}:1`)
      })
    })
  })

  describe('with two failing scenarios in the same file', function() {
    beforeEach(function() {
      const scenario1 = {
        line: 1,
        uri: this.feature1Path
      }
      const scenarioResult1 = {
        scenario: scenario1,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult1)
      const scenario2 = {
        line: 2,
        uri: this.feature1Path
      }
      const scenarioResult2 = {
        scenario: scenario2,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult2)
      this.rerunFormatter.handleAfterFeatures()
    })

    it('outputs the reference needed to run the scenarios again', function() {
      expect(this.output).to.eql(`${this.feature1RelativePath}:1:2`)
    })
  })

  describe('with two failing scenarios in different files', function() {
    beforeEach(function() {
      const scenario1 = {
        line: 1,
        uri: this.feature1Path
      }
      const scenarioResult1 = {
        scenario: scenario1,
        status: Status.FAILED
      }
      this.rerunFormatter.handleScenarioResult(scenarioResult1)
      const scenario2 = {
        line: 2,
        uri: this.feature2Path
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
        `${this.feature1RelativePath}:1\n` +
        `${this.feature2RelativePath}:2`
      )
    })
  })
})
