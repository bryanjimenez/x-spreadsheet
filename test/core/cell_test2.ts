import assert from "assert";
import { describe, it } from "mocha";
import { infixExprToSuffixExpr } from "../../src/core/cell";

describe("infixExprToSuffixExpr", () => {
  it("should return [9,1,+,2,3,+,*] when value is (9+1)*(2+3)", () => {
    assert.deepEqual(infixExprToSuffixExpr("(9+1)*(2+3)"), [
      "9",
      "1",
      "+",
      "2",
      "3",
      "+",
      "*",
    ]);
  });

  it("should return [9,3,1,-,+,2,3,+,*] when value is (9+(3-1))*(2+3)", () => {
    assert.deepEqual(infixExprToSuffixExpr("(9+(3-1))*(2+3)"), [
      "9",
      "3",
      "1",
      "-",
      "+",
      "2",
      "3",
      "+",
      "*",
    ]);
  });
  it("should return [9,3,1,-,+,2,3,+,*,4,2,/,+] when the value is (9+(3-1))*(2+3)+4/2", () => {
    assert.deepEqual(infixExprToSuffixExpr("(9+(3-1))*(2+3)+4/2"), [
      "9",
      "3",
      "1",
      "-",
      "+",
      "2",
      "3",
      "+",
      "*",
      "4",
      "2",
      "/",
      "+",
    ]);
  });
  describe("concatenation &", function () {
    it("two parameter ", () => {
      assert.deepEqual(infixExprToSuffixExpr('"test" & "test"'), [
        '"test',
        '"test',
        "&",
      ]);
    });
    it("three parameters", () => {
      assert.deepEqual(infixExprToSuffixExpr('"test" & "test" & "no?"'), [
        '"test',
        '"test',
        "&",
        '"no?',
        "&",
      ]);
    });
    it("string & number", () => {
      assert.deepEqual(infixExprToSuffixExpr('"test" & 1'), [
        '"test',
        "1",
        "&",
      ]);
    });
    it("string & symbol", () => {
      assert.deepEqual(infixExprToSuffixExpr('"test" & +'), [
        '"test',
        '"+',
        "&",
      ]);
    });
    it("complex", () => {
      assert.deepEqual(infixExprToSuffixExpr('(3+2) & "test" & (2+2)'), [
        "3",
        "2",
        "+",
        '"test',
        "&",
        "2",
        "2",
        "+",
        "&",
      ]);
    });
    it("inside function, as param", () => {
      assert.deepEqual(infixExprToSuffixExpr('CONCAT("head"&"neck","body")'), [
        '"head',
        '"neck',
        "&",
        '"body',
        ["CONCAT", 2],
      ]);
    });
    it("inside function, as param", () => {
      assert.deepEqual(
        infixExprToSuffixExpr('CONCAT("hat","head"&"neck","body")'),
        ['"hat', '"head', '"neck', "&", '"body', ["CONCAT", 3]]
      );
    });
    it("after function", () => {
      assert.deepEqual(infixExprToSuffixExpr('CONCAT("hat","head") & "body"'), [
        '"hat',
        '"head',
        ["CONCAT", 2],
        '"body',
        "&",
      ]);
    });
    it("before function", () => {
      assert.deepEqual(infixExprToSuffixExpr('"body" & CONCAT("hat","head")'), [
        '"body',
        '"hat',
        '"head',
        ["CONCAT", 2],
        "&",
      ]);
    });
    it("before unary function", () => {
      assert.deepEqual(infixExprToSuffixExpr('"body" & MD5("hat")'), [
        '"body',
        '"hat',
        ["MD5", 1],
        "&",
      ]);
    });
  });
});
