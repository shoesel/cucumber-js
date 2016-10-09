var path = require('path');
var figures = require('figures');

var helpers = {

  getAdditionalErrorText: function getAdditionalErrorText(lastRun) {
    return 'Error:\n' + lastRun.error + '.\n' +
           'stdout:\n' + lastRun.stdout +
           'stderr:\n' + lastRun.stderr;
  },

  normalizeText: function normalizeText(text) {
    return figures(text)
      .replace(/\033\[[0-9;]*m/g, '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/^\s+/g, '')
      .replace(/\s+$/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\d+m\d{2}\.\d{3}s/, '<duration-stat>')
      .replace(/\//g, path.sep)
      .split('\n')
      .map(function(line){
        return line
          .replace(/^\s+/g, '')
          .replace(/\s+$/g, '')
      })
      .join('\n');
  }

};

module.exports = helpers;
