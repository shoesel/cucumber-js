import _ from 'lodash'
import {Transform} from 'cucumber-expressions'
import arity from 'util-arity'
import HookDefinition from './models/hook_definition'
import isGenerator from 'is-generator'
import Listener from './listener'
import path from 'path'
import StackTrace from 'stacktrace-js'
import StepDefinition from './models/step_definition'
import TransformLookupBuilder from './transform_lookup_builder'

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
    After: defineHook(options.afterHookDefinitions),
    Before: defineHook(options.beforeHookDefinitions),
    defineStep: defineStep(options.stepDefinitions),
    registerHandler: registerHandler(cwd, options.listeners),
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

function defineHook(collection) {
  return (options, code) => {
    if (typeof(options) === 'string') {
      options = {tags: options}
    } else if (typeof(options) === 'function') {
      code = options
      options = {}
    }
    const {line, uri} = getDefinitionLineAndUri()
    const hookDefinition = new HookDefinition({code, line, options, uri})
    collection.push(hookDefinition)
  }
}

function defineStep(collection) {
  return (pattern, options, code) => {
    if (typeof(options) === 'function') {
      code = options
      options = {}
    }
    const {line, uri} = getDefinitionLineAndUri()
    const stepDefinition = new StepDefinition({code, line, options, pattern, uri})
    collection.push(stepDefinition)
  }
}

function getDefinitionLineAndUri() {
  const stackframes = StackTrace.getSync()
  const stackframe = stackframes.length > 2 ? stackframes[2] : stackframes[0]
  const line = stackframe.getLineNumber()
  const uri = stackframe.getFileName() || 'unknown'
  return {line, uri}
}

function registerHandler(cwd, collection) {
  return (eventName, options, handler) => {
    if (typeof(options) === 'function') {
      handler = options
      options = {}
    }
    _.assign(options, getDefinitionLineAndUri(), {cwd})
    const listener = new Listener(options)
    listener.setHandlerForEventName(eventName, handler)
    collection.push(listener)
  }
}

function wrapGeneratorFunctions({cwd, definitions, generatorFunctionWrapper}) {
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
