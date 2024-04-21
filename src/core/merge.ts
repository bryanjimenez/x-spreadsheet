import { CellRange, type CellRangePoints } from "./cell_range";

export class Merges {
  _: CellRange[];

  constructor(d: CellRange[] = []) {
    this._ = d;
  }

  forEach(cb: (...arg: unknown[]) => void) {
    this._.forEach(cb);
  }

  deleteWithin(cr: CellRangePoints) {
    this._ = this._.filter((it) => !it.within(cr));
  }

  getFirstIncludes(ri: number, ci: number) {
    for (let i = 0; i < this._.length; i += 1) {
      const it = this._[i];
      if (it.includes(ri, ci)) {
        return it;
      }
    }
    return null;
  }

  filterIntersects(cellRange: CellRangePoints) {
    return new Merges(this._.filter((it) => it.intersects(cellRange)));
  }

  intersects(cellRange: CellRangePoints) {
    for (let i = 0; i < this._.length; i += 1) {
      const it = this._[i];
      if (it.intersects(cellRange)) {
        // console.log('intersects');
        return true;
      }
    }
    return false;
  }

  union(cellRange: CellRangePoints) {
    let cr = cellRange;
    this._.forEach((it) => {
      if (it.intersects(cr)) {
        cr = it.union(cr);
      }
    });
    return cr;
  }

  add(cr: CellRangePoints) {
    this.deleteWithin(cr);
    this._.push(cr);
  }

  // type: row | column
  shift(
    type: "row" | "column",
    index: number,
    n: number,
    cbWithin: (sri: number, sci: number, noffset: number, i: number) => void
  ) {
    this._.forEach((cellRange) => {
      const { sri, sci, eri, eci } = cellRange;
      const range = cellRange;
      if (type === "row") {
        if (sri >= index) {
          range.sri += n;
          range.eri += n;
        } else if (sri < index && index <= eri) {
          range.eri += n;
          cbWithin(sri, sci, n, 0);
        }
      } else if (type === "column") {
        if (sci >= index) {
          range.sci += n;
          range.eci += n;
        } else if (sci < index && index <= eci) {
          range.eci += n;
          cbWithin(sri, sci, 0, n);
        }
      }
    });
  }

  move(cellRange: CellRangePoints, rn: number, cn: number) {
    this._.forEach((it1) => {
      const it = it1;
      if (it.within(cellRange)) {
        it.eri += rn;
        it.sri += rn;
        it.sci += cn;
        it.eci += cn;
      }
    });
  }

  setData(merges: string[]) {
    this._ = merges.map((merge) => CellRange.valueOf(merge));
    return this;
  }

  getData() {
    return this._.map((merge) => merge.toString());
  }
}
