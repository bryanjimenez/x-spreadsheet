function cloneDeep(obj: unknown) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeDeep<T>(object:Record<string,unknown> = {}, ...sources:Record<string,unknown>[]):T {
  sources.forEach((source) => {
    Object.keys(source).forEach((key) => {
      const v = source[key];
      // console.log('k:', key, ', v:', source[key], typeof v, v instanceof Object);
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      ) {
        object[key] = v;
      } else if (
        typeof v !== "function" &&
        !Array.isArray(v) &&
        v instanceof Object
      ) {
        object[key] = object[key] || {};
        mergeDeep(object[key], v);
      } else {
        object[key] = v;
      }
    });
  });
  // console.log('::', object);
  return object;
};

function equals<T extends Object>(obj1: T, obj2: T) {
  const keys = Object.keys(obj1) as (keyof T)[];
  if (keys.length !== Object.keys(obj2).length) return false;
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v1 = obj1[k];
    const v2 = obj2[k];
    if (v2 === undefined) return false;
    if (
      typeof v1 === "string" ||
      typeof v1 === "number" ||
      typeof v1 === "boolean"
    ) {
      if (v1 !== v2) return false;
    } else if (Array.isArray(v1)) {
      if (!Array.isArray(v2) || v1.length !== v2.length) return false;
      for (let ai = 0; ai < v1.length; ai += 1) {
        if (!equals(v1[ai], v2[ai])) return false;
      }
    } else if (
      typeof v1 !== "function" &&
      !Array.isArray(v1) &&
      v1 instanceof Object
    ) {
      if (!equals(v1, v2)) return false;
    }
  }
  return true;
}

/*
  objOrAry: obejct or Array
  cb: (value, index | key) => { return value }
*/
const sum = (
  objOrAry: Record<string, number> | number[],
  cb = (value: number, index?: string) => value
) => {
  let total = 0;
  let size = 0;
  Object.keys(objOrAry).forEach((key) => {
    total += cb(objOrAry[key], key);
    size += 1;
  });
  return [total, size];
};

function deleteProperty<T extends Record<string, unknown>>(
  obj: T,
  property: keyof T
) {
  const oldv = obj[String(property)];
  delete obj[String(property)];
  return oldv;
}

function rangeReduceIf(
  min: number,
  max: number,
  inits: number,
  initv: number,
  ifv: number,
  getv: (i: number) => number
) {
  let s = inits;
  let v = initv;
  let i = min;
  for (; i < max; i += 1) {
    if (s > ifv) break;
    v = getv(i);
    s += v;
  }
  return [i, s - v, v];
}

function rangeSum(min: number, max: number, getv: (i: number) => number) {
  let s = 0;
  for (let i = min; i < max; i += 1) {
    s += getv(i);
  }
  return s;
}

function rangeEach(min: number, max: number, cb: (i: number) => void) {
  for (let i = min; i < max; i += 1) {
    cb(i);
  }
}

function arrayEquals(a1: unknown[], a2: unknown[]) {
  if (a1.length === a2.length) {
    for (let i = 0; i < a1.length; i += 1) {
      if (a1[i] !== a2[i]) return false;
    }
  } else return false;
  return true;
}

function digits(a: unknown) {
  const v = `${a}`;
  let ret = 0;
  let flag = false;
  for (let i = 0; i < v.length; i += 1) {
    if (flag === true) ret += 1;
    if (v.charAt(i) === ".") flag = true;
  }
  return ret;
}

export function isNumber(x: unknown) {
  return (
    (typeof x === "number" || (typeof x === "string" && x.trim() !== "")) &&
    !isNaN(x as number)
  );
}

function numberOp(type: "-" | "+" | "*" | "/", num1: number, num2: number) {
    let ret = 0;
    if (type === "-") {
      ret = num1 - num2;
    } else if (type === "+") {
      ret = num1 + num2;
    } else if (type === "*") {
      ret = num1 * num2;
    } else if (type === "/") {
      ret = num1 / num2;
      if (digits(ret) > 5) return ret.toFixed(2);
    }
    return ret;
}

// export function numberCalc(type: "+" | "-" | "*" | "/", a1: number, a2: number): number;
export function numberCalc(
  type: "+" | "-" | "*" | "/",
  a1: unknown,
  a2: unknown
) {

  if (!isNumber(a1) && a1 === "" && isNumber(a2)) {
    return numberOp(type, 0, Number(a2));
  }

  if (!isNumber(a2) && a2 === "" && isNumber(a1)) {
    return numberOp(type, Number(a1), 0);
  }

  if (!isNumber(a1) || !isNumber(a2)) {
    return a1 + type + a2;
  }

  const al1 = digits(a1);
  const al2 = digits(a2);
  const num1 = Number(a1);
  const num2 = Number(a2);
  let ret = 0;
  if (type === "-" || type === "+" || type === "*" || type === "/") {
    return numberOp(type, num1, num2);
  }
  return ret.toFixed(Math.max(al1, al2));
}

export default {
  cloneDeep,
  merge: <T>(...sources:Record<string,unknown>[]) => mergeDeep<T>({}, ...sources),
  equals,
  arrayEquals,
  sum,
  rangeEach,
  rangeSum,
  rangeReduceIf,
  deleteProperty,
  numberCalc,
};
