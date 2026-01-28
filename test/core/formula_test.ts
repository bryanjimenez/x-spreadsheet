import assert from "assert";
import { describe, it } from "mocha";
import { formulam } from "../../src/core/formula";

describe("[formula.ts](./src/core/formula.ts)", function () {
  describe("formulam", () => {
    describe("#render()", () => {
      it("SUM: should return 36 when the value is []", () => {
        assert.equal(formulam.SUM.render([]), 0);
      });
      it("SUM: should return 36 when the value is ['12', '12', 12]", () => {
        assert.equal(formulam.SUM.render(["12", "12", 12]), 36);
      });
      it("SUM: should return #VALUE! when the value is ['a', '12', 12]", () => {
        assert.equal(formulam.SUM.render(["a", "12", 12]), "#VALUE!");
      });
      it('AVERAGE: should return "#DIV/0!" when the value is []', () => {
        assert.equal(formulam.AVERAGE.render([]), "#DIV/0!");
      });
      it("AVERAGE: should return 13 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.AVERAGE.render(["12", "13", 14]), 13);
      });
      it('AVERAGE: should return #VALUE! when the value is ["a", "13", 14]', () => {
        assert.equal(formulam.AVERAGE.render(["a", "13", 14]), "#VALUE!");
      });
      it('MAX: should return "#VALUE!" when the value is []', () => {
        assert.equal(formulam.MAX.render([]), "#VALUE!");
      });
      it("MAX: should return 14 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.MAX.render(["12", "13", 14]), 14);
      });
      it("MAX: should return 14 when the value is ['a', '13', 14]", () => {
        assert.equal(formulam.MAX.render(["a", "13", 14]), 14);
      });
      it("MAX: should return 0 when the value is ['a']", () => {
        assert.equal(formulam.MAX.render(["a"]), 0);
      });
      it('MIN: should return "#VALUE!" when the value is []', () => {
        assert.equal(formulam.MIN.render([]), "#VALUE!");
      });
      it("MIN: should return 12 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.MIN.render(["12", "13", 14]), 12);
      });
      it("MIN: should return 12 when the value is ['12', '13', 'a']", () => {
        assert.equal(formulam.MIN.render(["12", "13", "a"]), 12);
      });
      it("MIN: should return 0 when the value is ['a']", () => {
        assert.equal(formulam.MIN.render(["a"]), 0);
      });
      it('IF: should return "#VALUE!" when the value is []', () => {
        assert.equal(formulam.IF.render([]), "#VALUE!");
      });
      it("IF: should return 12 when the value is [12 > 11, 12, 11]", () => {
        assert.equal(formulam.IF.render([12 > 11, 12, 11]), 12);
      });
      it('IF: should return 12 when the value is ["true", 12, 11]', () => {
        assert.equal(formulam.IF.render(["true", 12, 11]), 12);
      });
      it('IF: should return 11 when the value is ["false", 12, 11]', () => {
        assert.equal(formulam.IF.render(["false", 12, 11]), 11);
      });
      it('IF: should return "#VALUE!" when the value is ["12 > 11", 12, 11]', () => {
        assert.equal(formulam.IF.render(["12 > 11", 12, 11]), "#VALUE!");
      });
      it('AND: should return "#VALUE!" when the value is []', () => {
        assert.equal(formulam.AND.render([]), "#VALUE!");
      });
      it('AND: should return true when the value is [true, "a", "ok", "+", "", "?"]', () => {
        assert.equal(formulam.AND.render([true, "a", "ok"]), true);
      });
      it('AND: should return false when the value is ["a", "ok", "+", "", "?", false]', () => {
        assert.equal(
          formulam.AND.render(["a", "ok", "+", "", "?", false]),
          false
        );
      });
      it("AND: should return false when the value is [false, true]", () => {
        assert.equal(formulam.AND.render([false, true]), false);
      });
      it("AND: should return false when the value is [0, true]", () => {
        assert.equal(formulam.AND.render([0, true]), false);
      });
      it('AND: should return false when the value is ["0", true]', () => {
        assert.equal(formulam.AND.render(["0", true]), false);
      });
      it('AND: should return false when the value is ["false", true]', () => {
        assert.equal(formulam.AND.render(["false", true]), false);
      });
      it('AND: should return false when the value is ["FALSE", true]', () => {
        assert.equal(formulam.AND.render(["FALSE", true]), false);
      });
      it('OR: should return "#VALUE!" when the value is []', () => {
        assert.equal(formulam.OR.render([]), "#VALUE!");
      });
      it('OR: should return true when the value is ["a", true]', () => {
        assert.equal(formulam.OR.render(["a", true]), true);
      });
      it('OR: should return true when the value is ["a", false]', () => {
        assert.equal(formulam.OR.render(["a", false]), true);
      });
      it("OR: should return false when the value is [0, false]", () => {
        assert.equal(formulam.OR.render([0, false]), false);
      });
      it('OR: should return false when the value is [0, false, "FALSE"]', () => {
        assert.equal(formulam.OR.render([0, false, "FALSE"]), false);
      });
      it('OR: should return false when the value is [0, false, true, "FALSE"]', () => {
        assert.equal(formulam.OR.render([0, false, true, "FALSE"]), true);
      });
      it('CONCAT: should return "" when the value is []', () => {
        assert.equal(formulam.CONCAT.render([]), "");
      });
      it("CONCAT: should return 1200USD when the value is ['1200', 'USD']", () => {
        assert.equal(formulam.CONCAT.render(["1200", "USD"]), "1200USD");
      });
    });
  });
});
