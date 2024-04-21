import md5 from "md5";
import { tf } from "../locale/locale";
import { numberCalc } from "./helper";

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
    // FIXME: numberCalc should probably throw
    render: (ary: number[]) => ary.reduce((a, b) => numberCalc("+", a, b), 0),
  },
  {
    key: "AVERAGE",
    title: tf("formula.average"),
    render: (ary: string[]) =>
      ary.reduce((a, b) => Number(a) + Number(b), 0) / ary.length,
  },
  {
    key: "MAX",
    title: tf("formula.max"),
    render: (ary: string[]) => Math.max(...ary.map((v) => Number(v))),
  },
  {
    key: "MIN",
    title: tf("formula.min"),
    render: (ary: string[]) => Math.min(...ary.map((v) => Number(v))),
  },
  {
    key: "IF",
    title: tf("formula._if"),
    render: ([b, t, f]: [boolean, unknown, unknown]) => (b ? t : f),
  },
  {
    key: "AND",
    title: tf("formula.and"),
    render: (ary: string[]) => ary.every((it) => it),
  },
  {
    key: "OR",
    title: tf("formula.or"),
    render: (ary: string[]) => ary.some((it) => it),
  },
  {
    key: "CONCAT",
    title: tf("formula.concat"),
    render: (ary: string[]) => ary.join(""),
  },
  {
    key: "MD5",
    operator: "unary",
    title: tf("formula.md5"),
    render: ([s]: [string]) => md5(s),
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
