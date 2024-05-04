import assert from "assert";
import { describe, it } from "mocha";
import {cloneDeep, isNumber, merge, sum } from "../src/core/helper";

describe("helper", () => {
  describe(".cloneDeep()", () => {
    it("The modification of the returned value does not affect the original value", () => {
      const obj = { k: { k1: "v" } };
      const obj1 = cloneDeep(obj);
      // @ts-ignore
      obj1.k.k1 = "v1";
      assert.equal(obj.k.k1, "v");
    });
  });
  describe(".merge()", () => {
    it("should return { a: 'a' } where the value is { a: 'a' }", () => {
      const m = merge({ a: "a" });
      // @ts-ignore
      assert.equal(m.a, "a");
    });
    it("should return {a: 'a', b: 'b'} where the value is {a: 'a'}, {b: 'b'}", () => {
      const m = merge({ a: "a" }, { b: "b" });
      // @ts-ignore
      const {a,b} = m;
      assert.equal(a, "a");
      assert.equal(b, "b");
    });
    it("should return { a: { a1: 'a2' }, b: 'b' } where the value is {a: {a1: 'a1'}, b: 'b'}, {a: {a1: 'b'}}", () => {
      const obj = { a: { a1: "a1" }, b: "b" };
      const m = merge(obj, { a: { a1: "a2" } });
      // @ts-ignore
      const {a, b} = m
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

  describe("isNumber", function (){
    it("'0' : true", function(){
      assert.equal(isNumber("0"), true)
    })
    it(" 0  : true", function(){
      assert.equal(isNumber(0), true)
    })

    it("'-' : false", function(){
      assert.equal(isNumber("-"), false)
    })

    it("'a' : false", function(){
      assert.equal(isNumber("a"), false)
    })
  })
});
