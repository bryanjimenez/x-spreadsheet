import { expr2xy, xy2expr } from "./alphabet";
import { isNumber, numberCalc } from "./helper";
import { Formula, formulam } from "./formula";

// Converting infix expression to a suffix expression
// src: AVERAGE(SUM(A1,A2), B1) + 50 + B20
// return: [A1, A2], SUM[, B1],AVERAGE,50,+,B20,+
export function infixExprToSuffixExpr(src: string) {
  const operatorStack = [];
  const stack = [];
  let subStrs = []; // SUM, A1, B2, 50 ...
  let fnArgType = 0; // 1 => , 2 => :
  let fnArgOperator = "";
  let fnArgsLen = 1; // A1,A2,A3...
  let oldc = "";
  for (let i = 0; i < src.length; i += 1) {
    const c = src.charAt(i);
    if (c !== " ") {
      if (c >= "a" && c <= "z") {
        subStrs.push(c.toUpperCase());
      } else if (
        (c >= "0" && c <= "9") ||
        (c >= "A" && c <= "Z") ||
        c === "."
      ) {
        subStrs.push(c);
      } else if (c === '"') {
        i += 1;
        while (src.charAt(i) !== '"' && src.length > i) {
          subStrs.push(src.charAt(i));
          i += 1;
        }
        stack.push(`"${subStrs.join("")}`);
        subStrs = [];
      } else if (c === "-" && /[+\-*/,(]/u.test(oldc)) {
        subStrs.push(c);
      } else {
        // console.log('subStrs:', subStrs.join(''), stack);
        if (
          oldc === '"' &&
          c === "," &&
          operatorStack[operatorStack.length - 1] === "&"
        ) {
          // using &OP within a functions param
          stack.push(operatorStack.pop());
        }

        if (c !== "(" && subStrs.length > 0) {
          stack.push(subStrs.join(""));
        }
        if (c === ")") {
          let c1 = operatorStack.pop();
          if (fnArgType === 2) {
            // fn argument range => A1:B5
            try {
              const start = stack.pop();
              const end = stack.pop();
              if (typeof start !== "string" || typeof end !== "string") {
                throw new Error("Expected start and end cell locations");
              }

              const [ex, ey] = expr2xy(start);
              const [sx, sy] = expr2xy(end);
              // console.log('::', sx, sy, ex, ey);
              let rangelen = 0;
              for (let x = sx; x <= ex; x += 1) {
                for (let y = sy; y <= ey; y += 1) {
                  stack.push(xy2expr(x, y));
                  rangelen += 1;
                }
              }
              stack.push([c1, rangelen]);
            } catch (e) {
              // console.log(e);
            }
          } else if (fnArgType === 1 || fnArgType === 3) {
            if (fnArgType === 3) stack.push(fnArgOperator);
            // fn argument => A1,A2,B5
            stack.push([c1, fnArgsLen]);
            fnArgsLen = 1;
          } else if (c1 && formulam[c1]?.operator === "unary") {
            // md5 is unary operator
            // console.log('c1:', c1, fnArgType, stack, operatorStack);
            stack.push([c1, 1]);
          } else {
            // binary operators (+, -, ..)
            // console.log('c1:', c1, fnArgType, stack, operatorStack);
            while (c1 !== "(") {
              stack.push(c1);
              if (operatorStack.length <= 0) break;
              c1 = operatorStack.pop();
            }
          }
          fnArgType = 0;
        } else if (c === "=" || c === ">" || c === "<") {
          const nc = src.charAt(i + 1);
          fnArgOperator = c;
          if (nc === "=" || nc === "-") {
            fnArgOperator += nc;
            i += 1;
          }
          fnArgType = 3;
        } else if (c === ":") {
          fnArgType = 2;
        } else if (c === ",") {
          if (fnArgType === 3) {
            stack.push(fnArgOperator);
          }
          fnArgType = 1;
          fnArgsLen += 1;
        } else if (c === "(" && subStrs.length > 0) {
          // function
          operatorStack.push(subStrs.join(""));
        } else if (
          (oldc === '"' && c === "&") ||
          (oldc === ")" && c === "&") ||
          oldc === "&"
        ) {
          const top = operatorStack[operatorStack.length - 1];

          if (oldc === '"' && c === "&" && top === "&") {
            stack.push(operatorStack.pop());
            operatorStack.push(c);
          } else if (c !== "(" && c !== "&") {
            // pushing an operator(symbol) as a parameter
            stack.push(`"${c}`);
          }
          // else if(c!=="(" ){
          else {
            operatorStack.push(c);
          }
        } else {
          // priority: */ > +-
          // console.log('xxxx:', operatorStack, c, stack);
          if (operatorStack.length > 0 && (c === "+" || c === "-")) {
            let top = operatorStack[operatorStack.length - 1];
            if (top !== "(") stack.push(operatorStack.pop());
            if (top === "*" || top === "/") {
              while (operatorStack.length > 0) {
                top = operatorStack[operatorStack.length - 1];
                if (top !== "(") stack.push(operatorStack.pop());
                else break;
              }
            }
          } else if (c !== "(" && operatorStack.length > 0) {
            const top = operatorStack[operatorStack.length - 1];
            if (top === "*" || top === "/") stack.push(operatorStack.pop());
          }
          operatorStack.push(c);
        }
        subStrs = [];
      }
      oldc = c;
    }
  }
  if (subStrs.length > 0) {
    stack.push(subStrs.join(""));
  }
  while (operatorStack.length > 0) {
    stack.push(operatorStack.pop());
  }
  return stack;
}

function evalSubExpr(
  subExpr: string,
  cellRender: (x: number, y: number) => string
) {
  const [fl] = subExpr;
  let expr = subExpr;
  if (fl === '"') {
    return subExpr.substring(1);
  }
  let ret = 1;
  if (fl === "-") {
    expr = subExpr.substring(1);
    ret = -1;
  }
  if (expr[0] >= "0" && expr[0] <= "9") {
    return ret * Number(expr);
  }
  const [x, y] = expr2xy(expr);
  const r = cellRender(x, y);

  if (isNumber(r)) {
    return ret * r;
  }

  return r;
}

// evaluate the suffix expression
// srcStack: <= infixExprToSufixExpr
// formulaMap: {'SUM': {}, ...}
// cellRender: (x, y) => {}
const evalSuffixExpr = (
  srcStack: unknown[],
  formulaMap: Record<string, Formula>,
  cellRender: (x: number, y: number) => string,
  cellList: string[]
): string => {
  const stack: unknown[] = [];
  // console.log(':::::formulaMap:', formulaMap);
  for (let i = 0; i < srcStack.length; i += 1) {
    const expr = srcStack[i];
    const fc = expr[0];
    if (expr === "+") {
      const top = stack.pop();
      stack.push(numberCalc("+", stack.pop(), top));
    } else if (expr === "-") {
      if (stack.length === 1) {
        const top = stack.pop();
        stack.push(numberCalc("*", top, -1));
      } else {
        const top = stack.pop();
        stack.push(numberCalc("-", stack.pop(), top));
      }
    } else if (expr === "*") {
      stack.push(numberCalc("*", stack.pop(), stack.pop()));
    } else if (expr === "/") {
      const top = stack.pop();
      stack.push(numberCalc("/", stack.pop(), top));
    } else if (fc === "=" || fc === ">" || fc === "<") {
      let top = stack.pop() as number;
      if (!Number.isNaN(top)) top = Number(top);
      let left = stack.pop() as number;
      if (!Number.isNaN(left)) left = Number(left);

      let ret = false;
      if (fc === "=") {
        ret = left === top;
      } else if (expr === ">") {
        ret = left > top;
      } else if (expr === ">=") {
        ret = left >= top;
      } else if (expr === "<") {
        ret = left < top;
      } else if (expr === "<=") {
        ret = left <= top;
      }
      stack.push(ret);
    } else if (expr === "&") {
      const tail = stack.pop();
      const head = stack.pop();

      stack.push(String(head) + String(tail));
    } else if (Array.isArray(expr)) {
      const [formula, len] = expr as [keyof Formula, number];
      const params = [];
      for (let j = 0; j < len; j += 1) {
        params.push(stack.pop());
      }
      stack.push(formulaMap[formula].render(params.reverse()));
    } else {
      if (typeof expr !== "string") {
        throw new Error("Expected expr to be a string");
      }
      if (cellList.includes(expr)) {
        throw new Error("cellList includes expr");
        // return 0;
      }
      if ((fc >= "a" && fc <= "z") || (fc >= "A" && fc <= "Z")) {
        cellList.push(expr);
      }
      stack.push(evalSubExpr(expr, cellRender));
      cellList.pop();
    }
    // console.log('stack:', stack);
  }
  return stack[0];
};

/**
 * Get's called for each data-containing cell
 * @param {string} src Cell text
 * @param {*} formulaMap Formula Map
 * @param {*} getCellText
 * @param {*} cellList Sheet cell's list in formula ex: `=MD5(A1)` -> ['A1']
 */
function cellRender(
  src: string,
  formulaMap: Record<string, Formula>,
  getCellText: Function,
  cellList: string[] = []
): string {
  if (src[0] === "=") {
    const stack = infixExprToSuffixExpr(src.substring(1));
    if (stack.length <= 0) return src;
    return evalSuffixExpr(
      stack,
      formulaMap,
      (x: number, y: number) =>
        cellRender(getCellText(x, y), formulaMap, getCellText, cellList),
      cellList
    );
  }
  return src;
}

export default {
  render: cellRender,
};
