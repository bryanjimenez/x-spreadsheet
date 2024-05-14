import assert from "assert";
import { describe, it } from "mocha";
import {
  cloneDeep,
  isNumber,
  merge,
  numberCalc,
  sum,
  rangeReduceIf,
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
      // @ts-expect-error @typescript-eslint/no-unsafe-member-access
      obj1.k.k1 = "v1";
      assert.equal(obj.k.k1, "v");
    });
  });
  describe(".merge()", () => {
    it("should return { a: 'a' } where the value is { a: 'a' }", () => {
      const m = merge({ a: "a" });
      // @ts-expect-error @typescript-eslint/no-unsafe-member-access
      assert.equal(m.a, "a");
    });
    it("should return {a: 'a', b: 'b'} where the value is {a: 'a'}, {b: 'b'}", () => {
      const m = merge({ a: "a" }, { b: "b" });
      // @ts-expect-error @typescript-eslint/no-unsafe-member-access
      const { a, b } = m;
      assert.equal(a, "a");
      assert.equal(b, "b");
    });
    it("should return { a: { a1: 'a2' }, b: 'b' } where the value is {a: {a1: 'a1'}, b: 'b'}, {a: {a1: 'b'}}", () => {
      const obj = { a: { a1: "a1" }, b: "b" };
      const m = merge(obj, { a: { a1: "a2" } });
      // @ts-expect-error @typescript-eslint/no-unsafe-member-access
      const { a, b } = m;
      assert.equal(obj.a.a1, "a1");
      assert.equal(a.a1, "a2");
      assert.equal(b, "b");
    });
  });
  // sum
  describe(".sum()", () => {
    it("should return [50, 3] where the value is [10, 20, 20]", () => {
      const [total, size] = sum([10, 20, 20]);
      assert.equal(total, 50);
      assert.equal(size, 3);
    });
    it("should return [50, 3] where the value is {k1: 10, k2: 20, k3: 20}", () => {
      const [total, size] = sum({ k1: 10, k2: 20, k3: 20 });
      assert.equal(total, 50);
      assert.equal(size, 3);
    });
  });

  describe("isNumber", function () {
    it("'0' : true", function () {
      assert.equal(isNumber("0"), true);
    });
    it(" 0  : true", function () {
      assert.equal(isNumber(0), true);
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
