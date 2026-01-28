import { tf } from "../locale/locale";
import {
  isBoolean,
  isBooleanLoose,
  isBooleanStrict,
  isNumber,
  numberCalc,
} from "./helper";

// TODO: map key and render types
export interface Formula {
  key: string;
  title: (arg?: unknown) => string;
  render: Function;
  operator?: string;
}

export const baseFormulas: Formula[] = [
  {
    key: "SUM",
    title: tf("formula.sum"),
    render: (ary: number[]) =>
      ary.reduce((a, b) => {
        if (a === "#VALUE!" || !isNumber(b)) {
          return "#VALUE!";
        }
        return String(numberCalc("+", a, b));
      }, "0"),
  },
  {
    key: "AVERAGE",
    title: tf("formula.average"),
    render: (ary: string[]) => {
      if (ary.length === 0) {
        return "#DIV/0!";
      }

      const sum = ary.reduce((a, b) => {
        if (a === "#VALUE!" || !isNumber(b)) {
          return "#VALUE!";
        }
        return String(numberCalc("+", a, b));
      }, "0");

      if (sum === "#VALUE!") {
        return "#VALUE!";
      }

      return Number(sum) / ary.length;
    },
  },
  {
    key: "MAX",
    title: tf("formula.max"),
    render: (ary: string[]) => {
      if (ary.length === 0) {
        return "#VALUE!";
      }

      return Math.max(
        ...(ary.length < 2 ? [0] : []),
        ...ary.reduce<number[]>(
          (acc, v) => (!isNumber(v) ? acc : [...acc, Number(v)]),
          []
        )
      );
    },
  },
  {
    key: "MIN",
    title: tf("formula.min"),
    render: (ary: string[]) => {
      if (ary.length === 0) {
        return "#VALUE!";
      }

      return Math.min(
        ...(ary.length < 2 ? [0] : []),
        ...ary.reduce<number[]>(
          (acc, v) => (!isNumber(v) ? acc : [...acc, Number(v)]),
          []
        )
      );
    },
  },
  {
    key: "IF",
    title: tf("formula._if"),
    render: ([b, t, f]: [boolean, unknown, unknown]) => {
      if (b === undefined) {
        return "#VALUE!";
      }

      if (typeof b === "boolean" || isBoolean(b)) {
        return isBooleanStrict(b) ? t : f;
      }
      return "#VALUE!";
    },
  },
  {
    key: "AND",
    title: tf("formula.and"),
    render: (ary: string[]) => {
      if (ary.length === 0) {
        return "#VALUE!";
      }
      return ary.reduce((a, b) => isBooleanLoose(a) && isBooleanLoose(b), true);
    },
  },
  {
    key: "OR",
    title: tf("formula.or"),
    render: (ary: string[]) => {
      if (ary.length === 0) {
        return "#VALUE!";
      }
      return ary.reduce(
        (a, b) => isBooleanLoose(a) || isBooleanLoose(b),
        false
      );
    },
  },
  {
    key: "CONCAT",
    title: tf("formula.concat"),
    render: (ary: string[]) => ary.join(""),
  },
  /* support:  1 + A1 + B2 * 3
  {
    key: 'DIVIDE',
    title: tf('formula.divide'),
    render: ary => ary.reduce((a, b) => Number(a) / Number(b)),
  },
  {
    key: 'PRODUCT',
    title: tf('formula.product'),
    render: ary => ary.reduce((a, b) => Number(a) * Number(b),1),
  },
  {
    key: 'SUBTRACT',
    title: tf('formula.subtract'),
    render: ary => ary.reduce((a, b) => Number(a) - Number(b)),
  },
  */
];

export const formulam = baseFormulas.reduce<Record<string, Formula>>(
  (acc, f) => ({ ...acc, [f.key]: f }),
  {}
);
