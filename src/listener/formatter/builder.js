import _ from 'lodash'
import getColorFns from '../../get_color_fns'
import JavascriptSnippetSyntax from '../../step_definition_snippet_builder/javascript_snippet_syntax'
import JsonFormatter from './json'
import path from 'path'
import PrettyFormatter from './pretty'
import ProgressFormatter from './progress'
import RerunFormatter from './rerun'
import SnippetsFormatter from './snippets'
import StepDefinitionSnippetBuilder from '../../step_definition_snippet_builder'
import SummaryFormatter from './summary'

export default class FormatterBuilder {
  static build(type, options) {
    const Formatter = FormatterBuilder.getConstructorByType(type)
    const extendedOptions = _.assign({}, options, {
      colorFns: getColorFns(options.colorsEnabled),
      snippetBuilder: FormatterBuilder.getStepDefinitionSnippetBuilder(options)
    })
    return new Formatter(extendedOptions)
  }

  static getConstructorByType(type) {
    switch(type) {
      case 'json': return JsonFormatter
      case 'pretty': return PrettyFormatter
      case 'progress': return ProgressFormatter
      case 'rerun': return RerunFormatter
      case 'snippets': return SnippetsFormatter
      case 'summary': return SummaryFormatter
      default: throw new Error('Unknown formatter name "' + type + '".')
    }
  }

  static getStepDefinitionSnippetBuilder({cwd, snippetInterface, snippetSyntax, supportCodeLibrary}) {
    if (!snippetInterface) {
      snippetInterface = 'callback'
    }
    let Syntax = JavascriptSnippetSyntax
    if (snippetSyntax) {
      const fullSyntaxPath = path.resolve(cwd, snippetSyntax)
      Syntax = require(fullSyntaxPath)
    }
    return new StepDefinitionSnippetBuilder({
      snippetSyntax: new Syntax(snippetInterface),
      transformLookup: supportCodeLibrary.getTransformLookup()
    })
  }
}
