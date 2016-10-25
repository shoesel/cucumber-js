require('../../../support/spec_helper');

describe("Cucumber.Ast.Filter.ModularPartitioningRule", function() {
  var Cucumber = requireLib('cucumber');

  var rule = Cucumber.Ast.Filter.ModularPartitioningRule("3/5");

  describe("isSatisfiedByElement()", function() {
    it("should return true when element belongs to the requested partition", function() {
      rule.counter = 7;
      expect(rule.isSatisfiedByElement()).toBe(true);
    });

    it("should return false when element does not belong to the requested partition", function() {
      rule.counter = 6;
      expect(rule.isSatisfiedByElement()).toBe(false);
    });
  });
});
