var ModularPartitioningRule = function(part) {
  var self = {
    counter: 0,
    isSatisfiedByElement: function isSatisfiedByElement() {
      if (!/\d+\/\d+/.test(part)) {
        return true;
      }
      var result = part.split('/');
      var numberPartitions = parseInt(result[1], 10);
      var remainder = result[0] - 1;
      return (self.counter++ % numberPartitions) === remainder;
    }
  };
  return self;
};
module.exports = ModularPartitioningRule;
