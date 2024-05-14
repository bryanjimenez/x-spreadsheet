import assert from "assert";
import { describe, it } from "mocha";
import { formulam } from "../../src/core/formula";

describe("[formula.ts](./src/core/formula.ts)", function () {
  describe("formulam", () => {
    describe("#render()", () => {
      it("SUM: should return 36 when the value is ['12', '12', 12]", () => {
        assert.equal(formulam.SUM.render(["12", "12", 12]), 36);
      });
      it("AVERAGE: should return 13 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.AVERAGE.render(["12", "13", 14]), 13);
      });
      it("MAX: should return 14 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.MAX.render(["12", "13", 14]), 14);
      });
      it("MIN: should return 12 when the value is ['12', '13', 14]", () => {
        assert.equal(formulam.MIN.render(["12", "13", 14]), 12);
      });
      it("IF: should return 12 when the value is [12 > 11, 12, 11]", () => {
        assert.equal(formulam.IF.render([12 > 11, 12, 11]), 12);
      });
      it('AND: should return true when the value is ["a", true, "ok"]', () => {
        assert.equal(formulam.AND.render(["a", true, "ok"]), true);
      });
      it('AND: should return false when the value is ["a", false, "ok"]', () => {
        assert.equal(formulam.AND.render(["a", false, "ok"]), false);
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
      it("CONCAT: should return 1200USD when the value is ['1200', 'USD']", () => {
        assert.equal(formulam.CONCAT.render(["1200", "USD"]), "1200USD");
      });
      it("MD5: should return 78e731027d8fd50ed642340b7c9a63b3 when the value is message", () => {
        assert.equal(
          formulam.MD5.render(["message"]),
          "78e731027d8fd50ed642340b7c9a63b3"
        );
      });
    });
  });
});
