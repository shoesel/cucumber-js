import _ from 'lodash'
import arity from 'util-arity'
import isGenerator from 'is-generator'
import {Transform} from 'cucumber-expressions'
import path from 'path'
import TransformLookupBuilder from './transform_lookup_builder'
import * as helpers from './helpers'

function build({cwd, fns}) {
  const options = {
    afterHookDefinitions: [],
    beforeHookDefinitions: [],
    defaultTimeout: 5000,
    listeners: [],
    stepDefinitions: [],
    transformLookup: TransformLookupBuilder.build()
  }
  let generatorFunctionWrapper = null
  const fnContext = {
    addTransform({captureGroupRegexps, transformer, typeName}) {
      const transform = new Transform(
        typeName,
        function() {},
        captureGroupRegexps,
        transformer
      )
      options.transformLookup.addTransform(transform)
    },
    After: helpers.defineHook(options.afterHookDefinitions),
    Before: helpers.defineHook(options.beforeHookDefinitions),
    defineStep: helpers.defineStep(options.stepDefinitions),
    registerHandler: helpers.registerHandler(cwd, options.listeners),
    registerListener(listener) {
      options.listeners.push(listener)
    },
    setDefaultTimeout(milliseconds) {
      options.defaultTimeout = milliseconds
    },
    setGeneratorFunctionWrapper(fn) {
      generatorFunctionWrapper = fn
    },
    World(parameters) {
      this.parameters = parameters
    }
  }
  fnContext.Given = fnContext.When = fnContext.Then = fnContext.defineStep
  fns.forEach((fn) => fn.call(fnContext))
  wrapGeneratorFunctions({
    cwd,
    definitions: _.chain(['afterHook', 'beforeHook', 'step'])
      .map((key) => options[key + 'Definitions'])
      .flatten()
      .value(),
    generatorFunctionWrapper
  })
  options.World = fnContext.World
  return options
}

export function wrapGeneratorFunctions({cwd, definitions, generatorFunctionWrapper}) {
  const definitionsToWrap = _.filter(definitions, (definition) => {
    return isGenerator.fn(definition.code)
  })
  if (definitionsToWrap.length > 0 && !generatorFunctionWrapper) {
    const references = definitionsToWrap.map((definition) => {
      return path.relative(cwd, definition.uri) + ':' + definition.line
    }).join('\n  ')
    const message = `
      The following hook/step definitions use generator functions:

        ${references}

      Use 'this.setGeneratorFunctionWrapper(fn)' to configure how to wrap them.
      `
    throw new Error(message)
  }
  definitionsToWrap.forEach((definition) => {
    const codeLength = definition.code.length
    const wrappedFn = generatorFunctionWrapper(definition.code)
    definition.code = arity(codeLength, wrappedFn)
  })
}

export default {build}
