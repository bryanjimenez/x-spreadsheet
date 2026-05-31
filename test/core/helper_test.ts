import assert from "assert";
import { describe, it } from "mocha";
import {
  cloneDeep,
  isNumber,
  merge,
  numberCalc,
  rangeReduceIf,
  equals,
  isBoolean,
  isBooleanStrict,
  isBooleanLoose,
  arrayEquals,
  rangeSum,
} from "../../src/core/helper";

describe("[helper.ts](./src/core/helper.ts)", () => {
  describe(".numberCalc()", () => {
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
      it("10 / 3 = 3.33", () => {
        assert.equal(numberCalc("/", 10, 3), 3.33);
      });
      it("10 ! 3 = 3.33", () => {
        // @ts-expect-error intentionally testing param `type`
        assert.equal(numberCalc("!", "10.000", "3.00"), "0.000");
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
  describe(".cloneDeep()", () => {
    it("The modification of the returned value does not affect the original value", () => {
      const obj = { k: { k1: "v" } };
      const obj1 = cloneDeep(obj);
      obj1.k.k1 = "v1";
      assert.equal(obj.k.k1, "v");
    });
  });
  describe(".merge()", () => {
    it("should return { a: 'a' } where the value is { a: 'a' }", () => {
      const obj = { a: "a" };
      const m = merge<typeof obj>(obj);
      assert.equal(m.a, "a");
    });
    it("should return {a: 'a', b: 'b'} where the value is {a: 'a'}, {b: 'b'}", () => {
      const objA = { a: "a" };
      const objB = { b: "b" };
      const m = merge<typeof objA & typeof objB>(objA, objB);
      const { a, b } = m;
      assert.equal(a, "a");
      assert.equal(b, "b");
    });
    it("should return { a: { a1: 'a2' }, b: 'b' } where the value is {a: {a1: 'a1'}, b: 'b'}, {a: {a1: 'b'}}", () => {
      const obj = { a: { a1: "a1" }, b: "b" };
      const m = merge<typeof obj>(obj, { a: { a1: "a2" } });
      const { a, b } = m;
      assert.equal(obj.a.a1, "a1");
      assert.equal(a.a1, "a2");
      assert.equal(b, "b");
    });
    it("function", function () {
      const objA = { a: { a1: "a1", fn: () => 1 }, b: "b" };
      const objB = { a: { a1: "a2", fn: () => 2 } };
      const m = merge<typeof objA>(objA, objB);
      const { a, b } = m;
      assert.equal(objA.a.a1, "a1");
      assert.equal(a.a1, "a2");
      assert.equal(b, "b");
      assert.equal(b, "b");
      assert.equal(a.fn, objB.a.fn);
    });
  });
  describe("equals", function () {
    it("not eq key len: false", function () {
      const objA = {};
      const objB = { b: "s" };
      const actual = equals(objA, objB);
      assert.equal(actual, false);
    });
    it("eq key len: false", function () {
      const objA = { a: "t" };
      const objB = { a: "s" };
      const actual = equals(objA, objB);
      assert.equal(actual, false);
    });
    it("eq key len: true", function () {
      const objA = { a: "t" };
      const objB = { a: "t" };
      const actual = equals(objA, objB);
      assert.equal(actual, true);
    });
    it("eq array w/ diff len: false", function () {
      const objA = { a: [] };
      const objB = { a: ["s"] };
      const actual = equals(objA, objB);
      assert.equal(actual, false);
    });
    it("eq array w/ same len: false", function () {
      const objA = { a: ["t"] };
      const objB = { a: ["s"] };
      const actual = equals(objA, objB);
      assert.equal(actual, false);
    });
    it("eq object w/ same len: false", function () {
      const objA = { a: { a: "a" } };
      const objB = { a: { a: "b" } };
      const actual = equals(objA, objB);
      assert.equal(actual, false);
    });
  });
  describe("isBoolean", function () {
    it("1: true", function () {
      const actual = isBoolean(1);
      assert.equal(actual, true);
    });
    it("'true': true", function () {
      const actual = isBoolean("true");
      assert.equal(actual, true);
    });
    it("0: true", function () {
      const actual = isBoolean(0);
      assert.equal(actual, true);
    });
    it("'false'': true", function () {
      const actual = isBoolean("false");
      assert.equal(actual, true);
    });
    it("'a': false", function () {
      const actual = isBoolean("a");
      assert.equal(actual, false);
    });
  });
  describe("isBooleanStrict", function () {
    it("1: true", function () {
      const actual = isBooleanStrict(1);
      assert.equal(actual, true);
    });
    it("'true': true", function () {
      const actual = isBooleanStrict("true");
      assert.equal(actual, true);
    });
    it("0: false", function () {
      const actual = isBooleanStrict(0);
      assert.equal(actual, false);
    });
    it("'false'': true", function () {
      const actual = isBooleanStrict("false");
      assert.equal(actual, false);
    });
    it("'a': false", function () {
      const actual = isBooleanStrict("a");
      assert.equal(actual, false);
    });
  });
  describe("isBooleanLoose", function () {
    it("1: true", function () {
      const actual = isBooleanLoose(1);
      assert.equal(actual, true);
    });
    it("'true': true", function () {
      const actual = isBooleanLoose("true");
      assert.equal(actual, true);
    });
    it("0: false", function () {
      const actual = isBooleanLoose(0);
      assert.equal(actual, false);
    });
    it("'false'': false", function () {
      const actual = isBooleanLoose("false");
      assert.equal(actual, false);
    });
    it("'a': false", function () {
      const actual = isBooleanLoose("a");
      assert.equal(actual, true);
    });
  });
  describe("arrayEquals", function () {
    it("diff len: false", function () {
      const arrA = ["a"];
      const arrB = [];
      const actual = arrayEquals(arrA, arrB);
      assert.equal(actual, false);
    });
    it("same len: false", function () {
      const arrA = ["a"];
      const arrB = ["b"];
      const actual = arrayEquals(arrA, arrB);
      assert.equal(actual, false);
    });
    it("same len: true", function () {
      const arrA = ["a"];
      const arrB = ["a"];
      const actual = arrayEquals(arrA, arrB);
      assert.equal(actual, true);
    });
  });
  describe("rangeSum", function () {
    it("constant value range", function () {
      const start = 0;
      const end = 10;
      const valueFun = (_i: number) => 10;

      const actual = rangeSum(start, end, valueFun);
      assert.equal(actual, 100);
    });
  });

  describe("isNumber", function () {
    it("'0' : true", function () {
      assert.equal(isNumber("0"), true);
    });
    it(" 0  : true", function () {
      assert.equal(isNumber(0), true);
    });
    it("'0.0' : true", function () {
      assert.equal(isNumber("0.0"), true);
    });

    it("'0a' : false", function () {
      assert.equal(isNumber("0a"), false);
    });
    it("'-' : false", function () {
      assert.equal(isNumber("-"), false);
    });
    it("'a' : false", function () {
      assert.equal(isNumber("a"), false);
    });
  });
  describe(".rangeReduceIf()", function () {
    describe("uniform row height", function () {
      const uniformRowHeight = 35;

      const rows = { len: 1000, getHeight: (_i: number) => uniformRowHeight };

      it("no freeze", function () {
        const freeze = 0;
        const yScroll = 350;

        const [ri, top, height] = rangeReduceIf(
          freeze,
          rows.len,
          0,
          0,
          yScroll,
          (i) => rows.getHeight(i)
        );

        assert.equal(ri, 10);
        assert.equal(top, yScroll - uniformRowHeight);
        assert.equal(height, uniformRowHeight);
      });
      it("with freeze", function () {
        const freeze = 1;
        const yScroll = 350;

        const [ri, top, height] = rangeReduceIf(
          freeze,
          rows.len,
          0,
          0,
          yScroll,
          (i) => rows.getHeight(i)
        );

        assert.equal(ri, 11);
        assert.equal(top, yScroll - uniformRowHeight);
        assert.equal(height, uniformRowHeight);
      });
    });
  });
});
