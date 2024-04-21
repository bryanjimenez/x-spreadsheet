import { type CellData } from "..";
import { CellRange, CellRef } from "./cell_range";
// same as OperatorType from validator.ts?
// eslint-disable-next-line
export type Operator =  'all'|'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'|'be'
// operator: all|eq|neq|gt|gte|lt|lte|in|be
// value:
//   in => []
//   be => [min, max]
export class Filter {
  ci: number;
  operator: Operator;
  value: string[];

  constructor(ci: number, operator: Operator, value: string[]) {
    this.ci = ci;
    this.operator = operator;
    this.value = value;
  }

  set(operator: Operator, value: string[]) {
    this.operator = operator;
    this.value = value;
  }

  includes(v: string) {
    const { operator, value } = this;
    if (operator === "all") {
      return true;
    }
    if (operator === "in") {
      return value.includes(v);
    }
    return false;
  }

  vlength() {
    const { operator, value } = this;
    if (operator === "in") {
      return value.length;
    }
    return 0;
  }

  getData() {
    const { ci, operator, value } = this;
    return { ci, operator, value };
  }
}

export class Sort {
  ci: number;
  order: "asc" | "desc";

  constructor(ci: number, order: "asc" | "desc") {
    this.ci = ci;
    this.order = order;
  }

  asc() {
    return this.order === "asc";
  }

  desc() {
    return this.order === "desc";
  }
}

export default class AutoFilter {
  ref: CellRef | null;
  filters: Filter[];
  sort: Sort | null;

  constructor() {
    this.ref = null;
    this.filters = [];
    this.sort = null;
  }

  setData({
    ref,
    filters,
    sort,
  }: {
    ref: AutoFilter["ref"];
    filters: AutoFilter["filters"];
    sort: AutoFilter["sort"];
  }) {
    if (this.active()) {
      this.ref = ref;
      this.filters = filters.map(
        (it) => new Filter(it.ci, it.operator, it.value)
      );
      if (sort) {
        this.sort = new Sort(sort.ci, sort.order);
      }
    }
  }

  getData() {
    if (this.active()) {
      const { ref, filters, sort } = this;
      return { ref, filters: filters.map((it) => it.getData()), sort };
    }
    return {};
  }

  addFilter(ci: number, operator: Operator, value: string[]) {
    const filter = this.getFilter(ci);
    if (filter === null) {
      this.filters.push(new Filter(ci, operator, value));
    } else {
      filter.set(operator, value);
    }
  }

  setSort(ci: number, order?: "asc" | "desc") {
    this.sort = order ? new Sort(ci, order) : null;
  }

  includes(ri: number, ci: number) {
    if (this.active()) {
      return this.hrange().includes(ri, ci);
    }
    return false;
  }

  getSort(ci: number) {
    const { sort } = this;
    if (sort && sort.ci === ci) {
      return sort;
    }
    return null;
  }

  getFilter(ci: number) {
    const { filters } = this;
    for (let i = 0; i < filters.length; i += 1) {
      if (filters[i].ci === ci) {
        return filters[i];
      }
    }
    return null;
  }

  filteredRows(getCell: (r: number, c: number) => CellData | null) {
    // const ary = [];
    // let lastri = 0;
    const rset = new Set<number>();
    const fset = new Set<number>();
    if (this.active()) {
      const { sri, eri } = this.range();
      const { filters } = this;
      for (let ri = sri + 1; ri <= eri; ri += 1) {
        for (let i = 0; i < filters.length; i += 1) {
          const filter = filters[i];
          const cell = getCell(ri, filter.ci);
          const ctext = cell?.text ?? "";
          if (!filter.includes(ctext)) {
            rset.add(ri);
            break;
          } else {
            fset.add(ri);
          }
        }
      }
    }
    return { rset, fset };
  }

  items(
    ci: number,
    getCell: (rj: number, cj: number) => CellData
  ): Record<string, number> {
    const m: Record<string, number> = {};
    if (this.active()) {
      const { sri, eri } = this.range();
      for (let ri = sri + 1; ri <= eri; ri += 1) {
        const cell = getCell(ri, ci);
        if (
          cell !== null &&
          cell.text !== undefined &&
          !/^\s*$/.test(cell.text)
        ) {
          const key = cell.text;
          const cnt = (m[key] || 0) + 1;
          m[key] = cnt;
        } else {
          m[""] = (m[""] || 0) + 1;
        }
      }
    }
    return m;
  }

  range() {
    if (!this.ref) {
      throw new Error("Expected a cell ref");
    }
    return CellRange.valueOf(this.ref);
  }

  hrange() {
    const r = this.range();
    r.eri = r.sri;
    return r;
  }

  clear() {
    this.ref = null;
    this.filters = [];
    this.sort = null;
  }

  active() {
    if (this.ref === undefined) {
      // TODO: initialized as undefined?
      console.error("AutoFilter.ref === undefined");
      return false;
    }
    return this.ref !== null;
  }
}
