// src: include chars: [0-9], +, -, *, /
// // 9+(3-1)*3+10/2 => 9 3 1-3*+ 10 2/+
const infix2suffix = (src: string) => {
  const operatorStack: string[] = [];
  let stack: string[] = [];
  for (let i = 0; i < src.length; i += 1) {
    const c = src.charAt(i);
    if (c !== " ") {
      if (c >= "0" && c <= "9") {
        stack.push(c);
      } else if (c === ")") {
        let c1 = operatorStack.pop();
        while (c1 !== undefined && c1 !== "(") {
          stack.push(c1);
          c1 = operatorStack.pop();
        }
      } else {
        // priority: */ > +-
        if (operatorStack.length > 0 && (c === "+" || c === "-")) {
          const last = operatorStack[operatorStack.length - 1];
          if (last === "*" || last === "/") {
            if (operatorStack.length > 0) {
              stack = stack.concat(operatorStack);
            }
            // while (operatorStack.length > 0) {
            //   stack.push(operatorStack.pop());
            // }
          }
        }
        operatorStack.push(c);
      }
    }
  }
  if (operatorStack.length > 0) {
    stack = stack.concat(operatorStack);
  }
  // while (operatorStack.length > 0) {
  //   stack.push(operatorStack.pop());
  // }
  return stack;
};

export default {
  infix2suffix,
};
