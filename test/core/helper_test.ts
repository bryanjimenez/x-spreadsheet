import assert from "assert";
import { describe, it } from "mocha";
import { numberCalc } from "../../src/core/helper";

describe("helper", () => {
  describe("numberCalc()", () => {
    describe("number", () => {
      it("1 + 1 = 2", () => {
        assert.equal(numberCalc("+", 1, 1), 2);
      });
      it("1 - 1 = 0", () => {
        assert.equal(numberCalc("-", 1, 1), 0);
      });
      it("2 * 3 = 6", () => {
        assert.equal(numberCalc("*", 2, 3), 6);
      });
      it("9 / 3 = 3", () => {
        assert.equal(numberCalc("/", 9, 3), 3);
      });
    });
    describe("number and string", () => {
      it("1 + '' = 1", () => {
        assert.equal(numberCalc("+", 1, ""), 1);
      });
      it("1 + 'abc' = '1+abc'", () => {
        assert.equal(numberCalc("+", 1, "abc"), "1+abc");
      });
      it("1 - '' = 1", () => {
        assert.equal(numberCalc("-", 1, ""), 1);
      });
      it("'' - 1 = -1", () => {
        assert.equal(numberCalc("-", "", 1), -1);
      });
      it("1 - 'abc' = '1-abc'", () => {
        assert.equal(numberCalc("-", 1, "abc"), "1-abc");
      });
    });
    describe("string", () => {
      it("'abc' + 'abc' = 'abc+abc'", () => {
        assert.equal(numberCalc("+", "abc", "abc"), "abc+abc");
      });
      it("'abc' - 'abc' = 'abc-abc'", () => {
        assert.equal(numberCalc("-", "abc", "abc"), "abc-abc");
      });
      it("'abc' * 'abc' = 'abc*abc'", () => {
        assert.equal(numberCalc("*", "abc", "abc"), "abc*abc");
      });
      it("'abc' / 'abc' = 'abc/abc'", () => {
        assert.equal(numberCalc("/", "abc", "abc"), "abc/abc");
      });
    });
  });
});
