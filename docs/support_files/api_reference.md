# Support Files

## API Reference

All support files that export a function will be
called with a context that exposes the following methods:

---

#### this.addTransform({captureGroupRegexps, name, transformer})

Add a new transform to convert a capture group into something else.

* `captureGroupRegexps` - array of regular expressions to apply the transformer to
* `transformer` - function which transforms the captured group from a string into what is passed to the step definition
* `typeName` - string used to refer to this type in cucumber expressions

The built in transforms are:
```js
// Float
{
  captureGroupRegexps: ['-?\\d*\\.?\\d+'],
  transformer: parseInt,
  typeName: 'int'
}

// Int
{
  captureGroupRegexps: ['-?\\d+'],
  transformer: parseFloat,
  typeName: 'float'
}

// String in double quotes
{
  captureGroupRegexps: ['"[^"]*"'],
  transformer: JSON.parse,
  typeName: 'stringInDoubleQuotes'
}
```

---

#### this.After([options,] code)

Defines a hook which is run after each scenario.

* `options`
  * object with the following keys:
    * `tags` - string tag expression used to apply this hook to only specific scenarios. See [cucumber-tag-expressions](https://docs.cucumber.io/tag-expressions/) for more information
    * `timeout` - hook specific timeout to override the default timeout
  * string as a shorthand for specifying `tags`
* `code` - a javascript function. The first argument will be a [ScenarioResult](/src/models/scenario_result.js). May optionally take an additional argument if using the asynchronous callback interface.

Multiple *After* hooks are executed in the **reverse** order that they were defined.

---

#### this.Before([options,] code)

Defines a hook which is run before each scenario. Same interface as *this.After*.
Multiple *Before* hooks are executed in the order that they were defined.

---

#### this.defineStep(pattern, [options,] code)

Defines a step. *Aliases: this.Given, this.When, this.Then*

* `pattern` - regex or string pattern to match against a gherkin step
* `options` - object with the following keys
  * `timeout` - step specific timeout to override the default timeout
* `code` - a javascript function. Should have one argument for each capture in the
  regular expression. May have an additional argument if the gherkin step has
  a doc string or data table. Finally may optionally take an additional argument
  as a callback if using that interface.

---

#### this.Given(pattern, [options,] code)

Alias of *this.defineStep*

---

#### this.registerHandler(event, [options,] code)

* `event` - one of the supported event names listed [here](./event_handlers.md)
* `options` - object with the following keys
  * `timeout` - step specific timeout to override the default timeout
* `code` - a javascript function. The first argument is the object as defined [here](./event_handlers.md). May optionally take an additional argument
  as a callback if using that interface.

---

#### this.setDefaultTimeout(milliseconds)

Set the default timeout for asynchronous steps. Default is `5000` milliseconds.

---

#### this.setGeneratorFunctionWrapper(fn)

Set the function used to wrap generator functions. An example wrapper is [Bluebird](https://github.com/petkaantonov/bluebird/)'s `Promise.coroutine`

---

#### this.Then(pattern, [options,] code)

Alias of *this.defineStep*

---

#### this.When(pattern, [options,] code)

Alias of *this.defineStep*

---

#### this.World

Set to a custom world constructor to override the default (`function () {}`).

**Note:** The World constructor was made strictly synchronous in *[v0.8.0](https://github.com/cucumber/cucumber-js/releases/tag/v0.8.0)*.
