import proxyWithArity from './proxy_with_arity'

const validProxyLengths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const invalidProxyLenghts = [-1, 11]

describe('proxyWithArity', function() {
  beforeEach(function() {
    this.fn = sinon.stub()
    this.context = {some: 'context'}
    this.arguments = ['a', 'b', 'c']
  })

  validProxyLengths.forEach(function(proxyLength) {
    describe(`proxyLength ${proxyLength}`, function() {
      beforeEach(function() {
        this.proxy = proxyWithArity(this.fn, proxyLength)
      })

      it(`returns a function of length ${proxyLength}`, function() {
        expect(this.proxy).to.have.lengthOf(proxyLength)
      })

      it('returns a function which proxies to fn', function() {
        this.proxy.apply(this.context, this.arguments)
        expect(this.fn).to.have.been.calledOnce
        expect(this.fn.firstCall.thisValue).to.eql(this.context)
        expect(this.fn.firstCall.args).to.eql(this.arguments)
      })
    })
  })

  invalidProxyLenghts.forEach(function(proxyLength) {
    describe(`proxyLength ${proxyLength}`, function() {
      it('throws an error', function() {
        expect(() => {
          proxyWithArity(this.fn, proxyLength)
        }).to.throw(`Unsupported proxy length: ${proxyLength}`)
      })
    })
  })
})
