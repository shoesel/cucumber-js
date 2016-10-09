import SupportCodeLibraryBuilder from './support_code_library_builder'

describe('SupportCodeLibraryBuilder', function () {
  describe('no support code fns', function() {
    beforeEach(function() {
      this.options = SupportCodeLibraryBuilder.build({cwd: 'path/to/project', fns: []})
    })

    it('returns the default options', function() {
      expect(this.options.afterHookDefinitions).to.eql([])
      expect(this.options.beforeHookDefinitions).to.eql([])
      expect(this.options.defaultTimeout).to.eql(5000)
      expect(this.options.listeners).to.eql([])
      expect(this.options.stepDefinitions).to.eql([])
      const worldInstance = new this.options.World({some: 'data'})
      expect(worldInstance.parameters).to.eql({some: 'data'})
    })
  })
})
