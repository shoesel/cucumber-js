import _ from 'lodash'
import HookDefinition from './models/hook_definition'
import Listener from './listener'
import StackTrace from 'stacktrace-js'
import StepDefinition from './models/step_definition'
import TransformLookupBuilder from './transform_lookup_builder'
import {Transform} from 'cucumber-expressions'

function build({cwd, fns}) {
  const options = {
    afterHookDefinitions: [],
    beforeHookDefinitions: [],
    defaultTimeout: 5000,
    listeners: [],
    stepDefinitions: [],
    transformLookup: TransformLookupBuilder.build()
  }
  const fnContext = {
    addTransform(...tranformArgs) {
      options.transformLookup.addTransform(new Transform(...tranformArgs))
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
    World(parameters) {
      this.parameters = parameters
    }
  }
  fnContext.Given = fnContext.When = fnContext.Then = fnContext.defineStep
  fns.forEach((fn) => fn.call(fnContext))
  options.World = fnContext.World
  return options
}

function defineHook(collection) {
  return (options, code) => {
    if (typeof(options) === 'function') {
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

export default {build}
