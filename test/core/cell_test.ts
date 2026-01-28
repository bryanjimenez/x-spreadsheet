import assert from "assert";
import { describe, it } from "mocha";
import cell, { infixExprToSuffixExpr } from "../../src/core/cell";
import { formulam } from "../../src/core/formula";

describe("[cell.ts](./src/core/cell.ts)", function () {
  describe(".infixExprToSuffixExpr()", () => {
    it('should return [""my name:","A1", "" score:","50",["CONCAT",4]] when =CONCAT("my name:", A1, " score:", 50)', () => {
      assert.deepEqual(
        infixExprToSuffixExpr('CONCAT("my name:", A1, " score:", 50)'),
        ['"my name:', "A1", '" score:', "50", ["CONCAT", 4]]
      );
    });
    it("should return ['A1','B2',['SUM',2],'C1','C5',['AVERAGE',3],'50','+','B20','+'] when AVERAGE(SUM(A1,B2), C1, C5) + 50 + B20", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("AVERAGE(SUM(A1,B2), C1, C5) + 50 + B20"),
        // eslint-disable-next-line
        ["A1","B2",["SUM", 2],"C1","C5",["AVERAGE", 3],"50","+","B20","+",]
      );
    });
    it("should return ['A1','B2','B3',['SUM',3],'C1','C5',['AVERAGE',3],'50','+','B20','+'] when ((AVERAGE(SUM(A1,B2, B3), C1, C5) + 50) + B20)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("((AVERAGE(SUM(A1,B2, B3), C1, C5) + 50) + B20)"),
        // eslint-disable-next-line
        ["A1","B2","B3",["SUM", 3],"C1","C5",["AVERAGE", 3],"50","+","B20","+",]
      );
    });
    it('should return ["1","1","==","t","f",["IF",3]] when IF(1==1, "t", "f")', () => {
      assert.deepEqual(
        infixExprToSuffixExpr('IF(1==1, "t", "f")'),
        // eslint-disable-next-line
      ["1","1","==",'"t','"f',["IF", 3],]);
    });
    it('should return ["1","1","=","t","f",["IF",3]] when =IF(1=1, "t", "f")', () => {
      assert.deepEqual(
        infixExprToSuffixExpr('IF(1=1, "t", "f")'),
        // eslint-disable-next-line
      ["1","1","=",'"t','"f',["IF", 3],]);
    });
    it("should return ['2','1','>','2','1',['IF',3]] when =IF(2>1, 2, 1)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("IF(2>1, 2, 1)"),
        // eslint-disable-next-line
      ["2","1",">","2","1",["IF", 3],]);
    });
    it("should return ['1','1','=',['AND',1],'2','1',['IF',3]] when IF(AND(1=1), 2, 1)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("IF(AND(1=1), 2, 1)"),
        // eslint-disable-next-line
      ["1","1","=",["AND", 1],"2","1",["IF", 3],]);
    });
    it("should return ['1','1','=','2','1','>',['AND',2],'2','1',['IF',3]] when =IF(AND(1=1, 2>1), 2, 1)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("IF(AND(1=1, 2>1), 2, 1)"),
        // eslint-disable-next-line
      ["1","1","=","2","1",">",["AND", 2],"2","1",["IF", 3],]);
    });
    it("should return ['10','5','-','20','-'] when =10-5-20", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("10-5-20"),
        // eslint-disable-next-line
      ["10","5","-","20","-",]);
    });
    it("should return ['10','5','-','20','10','*','-'] when =10-5-20*10", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("10-5-20*10"),
        // eslint-disable-next-line
      ["10","5","-","20","10","*","-",]);
    });
    it("should return ['10','5','20','*','-'] when =10-5*20", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("10-5*20"),
        // eslint-disable-next-line
      ["10","5","20","*","-",]);
    });
    it("should return ['1','0','5','-','2','0','+'] when =10-5+20", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("10-5+20"),
        // eslint-disable-next-line
      ["10","5","-","20","+",]);
    });
    it("should return ['1','2','+','3','4','+','*'] when =(1+2)*(3+4)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("(1+2)*(3+4)"),
        // eslint-disable-next-line
        ["1","2","+","3","4", "+", "*"]
      );
    });
    it("should return ['1','2','3','*','+','4','5','*','6','+','7','*','+'] when =1 + 2*3 + (4 * 5 + 6) * 7", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("1+2*3+(4*5+6)*7"),
        // eslint-disable-next-line
        ["1","2","3","*","+","4","5","*","6","+","7","*","+"]
      );
    });
    it("should return ['9','3','1','2','*','-','3','*','+','4','2','/','+'] when =9+(3-1*2)*3+4/2", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("9+(3-1*2)*3+4/2"),
        // eslint-disable-next-line
        ["9","3","1","2","*","-","3","*","+","4","2","/","+"]
      );
    });
    it("should return ['9','3','1','-','+','2','3','+','*','4','2','/','+'] when =(9+(3-1))*(2+3)+4/2", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("(9+(3-1))*(2+3)+4/2"),
        // eslint-disable-next-line
        ["9","3","1","-","+","2","3","+","*","4","2","/","+"]
      );
    });
    it("should return [1,SUM] when =SUM(1)", () => {
      assert.deepEqual(infixExprToSuffixExpr("SUM(1)"), ["1", "SUM"]);
    });
    it("should return SUM when =SUM()", () => {
      assert.deepEqual(infixExprToSuffixExpr("SUM()"), ["SUM"]);
    });
    it("should return SUM when =SUM(", () => {
      assert.deepEqual(infixExprToSuffixExpr("SUM("), ["SUM"]);
    });
    it("should return [9,1,+,2,3,+,*] when =(9+1)*(2+3)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("(9+1)*(2+3)"),
        // eslint-disable-next-line
        ["9","1","+","2","3","+","*",]);
    });

    it("should return [9,3,1,-,+,2,3,+,*] when =(9+(3-1))*(2+3)", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("(9+(3-1))*(2+3)"),
        // eslint-disable-next-line
      ["9","3","1","-","+","2","3","+","*",]);
    });
    it("should return [9,3,1,-,+,2,3,+,*,4,2,/,+] when =(9+(3-1))*(2+3)+4/2", () => {
      assert.deepEqual(
        infixExprToSuffixExpr("(9+(3-1))*(2+3)+4/2"),
        // eslint-disable-next-line
        ["9","3","1","-","+","2","3","+","*","4","2","/","+",]);
    });
    describe("concatenation & operator", function () {
      it("should return ['\"test','\"test','&'] when =\"test\" & \"test\"", () => {
        assert.deepEqual(
          infixExprToSuffixExpr('"test" & "test"'),
          // eslint-disable-next-line
        ['"test','"test',"&",]);
      });
      it("should return ['\"test','\"test','&', '\"no?', '&'] when =\"test\" & \"test\" & \"no?\"", () => {
        assert.deepEqual(
          infixExprToSuffixExpr('"test" & "test" & "no?"'),
          // eslint-disable-next-line
        ['"test','"test',"&",'"no?',"&",]);
      });
      it("should return ['\"test','1','&'] when =\"test\" & 1", () => {
        assert.deepEqual(
          infixExprToSuffixExpr('"test" & 1'),
          // eslint-disable-next-line
        ['"test',"1","&",]);
      });
      it("should return ['\"test','\"+','&'] when =\"test\" & +", () => {
        assert.deepEqual(
          infixExprToSuffixExpr('"test" & +'),
          // eslint-disable-next-line
        ['"test','"+',"&",]);
      });
      it("should return ['3','2','+',\"test','&','2','2','+','&'] when =(3+2) & \"test\" & (2+2)", () => {
        assert.deepEqual(
          infixExprToSuffixExpr('(3+2) & "test" & (2+2)'),
          // eslint-disable-next-line
        ["3","2","+",'"test',"&","2","2","+","&",]);
      });
      it("should return ['\"head','\"neck','&', '\"body', ['CONCAT', 2]] when =CONCAT(\"head\"&\"neck\",\"body\")", () => {
        // inside function, as param
        assert.deepEqual(
          infixExprToSuffixExpr('CONCAT("head"&"neck","body")'),
          ['"head', '"neck', "&", '"body', ["CONCAT", 2]]
        );
      });
      it("should return ['\"hat', '\"head', '\"neck', '&', '\"body', ['CONCAT', 3]] when =CONCAT(\"hat\",\"head\"&\"neck\",\"body\")", () => {
        // inside function, as param
        assert.deepEqual(
          infixExprToSuffixExpr('CONCAT("hat","head"&"neck","body")'),
          ['"hat', '"head', '"neck', "&", '"body', ["CONCAT", 3]]
        );
      });
      it("should return ['\"hat','\"head',['CONCAT', 2],'\"body','&'] when =CONCAT(\"hat\",\"head\") & \"body\"", () => {
        // after function
        assert.deepEqual(
          infixExprToSuffixExpr('CONCAT("hat","head") & "body"'),
          ['"hat', '"head', ["CONCAT", 2], '"body', "&"]
        );
      });
      it("should return ['\"body','\"hat','\"head',['CONCAT', 2],'&'] when =\"body\" & CONCAT(\"hat\",\"head\")", () => {
        // before function
        assert.deepEqual(
          infixExprToSuffixExpr('"body" & CONCAT("hat","head")'),
          ['"body', '"hat', '"head', ["CONCAT", 2], "&"]
        );
      });
      it.skip("should return ['\"body','\"hat',['SUM', 1],'&'] when =\"body\" & SUM(\"1\")", () => {
        // before unary function
        assert.deepEqual(
          infixExprToSuffixExpr('"body" & SUM("1")'),
          // eslint-disable-next-line
        ['"body','"1',"SUM","&",]);
      });
    });
  });

  describe("cell", () => {
    describe(".render()", () => {
      it("should return 0 + 2 + 2 + 6 + 49 + 20 when =SUM(A1,B2, C1, C5) + 50 + B20", () => {
        assert.equal(
          cell.render(
            "=SUM(A1,B2, C1, C5) + 50 + B20",
            formulam,
            (x: number, y: number) => x + y
          ),
          0 + 2 + 2 + 6 + 50 + 20
        );
      });
      it("should return 50 + 20 when =50 + B20", () => {
        assert.equal(
          cell.render("=50 + B20", formulam, (x: number, y: number) => x + y),
          50 + 20
        );
      });
      it("should return 2 when =IF(2>1, 2, 1)", () => {
        assert.equal(
          cell.render(
            "=IF(2>1, 2, 1)",
            formulam,
            (x: number, y: number) => x + y
          ),
          2
        );
      });
      it("should return 1 + 500 - 20 when =AVERAGE(A1:A3) + 50 * 10 - B20", () => {
        assert.equal(
          cell.render(
            "=AVERAGE(A1:A3) + 50 * 10 - B20",
            formulam,
            (x: number, y: number) =>
              // console.log('x:', x, ', y:', y);
              x + y
          ),
          1 + 500 - 20
        );
      });
    });
  });
});
