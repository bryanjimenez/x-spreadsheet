import { type CellData, type RowList } from "..";
import { expr2expr } from "./alphabet";
import _cell from "./cell";
import { type CellRange } from "./cell_range";
import { rangeSum, cloneDeep } from "./helper";
import { formulam } from "./formula";
import { type CopyType } from "./data_proxy";

/**
 * Data for representing a row
 */
export interface RowData {
  height?: number;
  hide?: boolean;
  style?: string;
  cells: {
    [key: string]: CellData;
  };
}

class Rows {
  _: RowList;
  len: number;
  height: number;
  hide?: boolean;
  cells?: Record<string, CellData>;

  constructor({ len, height }: { len: number; height: number }) {
    this._ = {};
    this.len = len;
    // default row height
    this.height = height;
  }

  getHeight(ri: number) {
    if (this.isHide(ri)) return 0;
    const row = this.get(ri);
    if (row && row.height) {
      return row.height;
    }
    return this.height;
  }

  setHeight(ri: number, v: number) {
    const row = this.getOrNew(ri);
    row.height = v;
  }

  unhide(idx: number) {
    let index = idx;
    while (index > 0) {
      index -= 1;
      if (this.isHide(index)) {
        this.setHide(index, false);
      } else break;
    }
  }

  isHide(ri: number) {
    const row = this.get(ri);
    return row && row.hide;
  }

  setHide(ri: number, v: boolean) {
    const row = this.getOrNew(ri);
    if (v) row.hide = true;
    else delete row.hide;
  }

  setStyle(ri: number, style: string) {
    const row = this.getOrNew(ri);
    row.style = style;
  }

  sumHeight(min: number, max: number, exceptSet?: Set<number>) {
    return rangeSum(min, max, (i: number) => {
      if (exceptSet && exceptSet.has(i)) return 0;
      return this.getHeight(i);
    });
  }

  totalHeight() {
    return this.sumHeight(0, this.len);
  }

  get(ri: number): RowData {
    return this._[ri];
  }

  getOrNew(ri: number) {
    this._[ri] ??= { cells: {} };
    return this._[ri];
  }

  getCell(ri: number, ci: number): CellData | null {
    const row = this.get(ri);
    if (
      row !== undefined &&
      row.cells !== undefined &&
      row.cells[ci] !== undefined
    ) {
      return row.cells[ci];
    }
    return null;
  }

  getCellMerge(ri: number, ci: number) {
    const cell = this.getCell(ri, ci);
    if (cell && cell.merge) return cell.merge;
    return [0, 0];
  }

  getCellOrNew(ri: number, ci: number) {
    const row = this.getOrNew(ri);
    row.cells[ci] ??= {};
    return row.cells[ci];
  }

  // what: all | text | format
  setCell(ri: number, ci: number, cell: CellData, what = "all") {
    const row = this.getOrNew(ri);
    if (what === "all") {
      row.cells[ci] = cell;
    } else if (what === "text") {
      row.cells[ci] ??= {};
      row.cells[ci].text = cell.text;
    } else if (what === "format") {
      row.cells[ci] ??= {};
      row.cells[ci].style = cell.style;
      if (cell.merge) row.cells[ci].merge = cell.merge;
    }
  }

  setCellText(ri: number, ci: number, text: string) {
    const cell = this.getCellOrNew(ri, ci);
    if (cell.editable !== false) cell.text = text;
  }

  // what: all | format | text
  copyPaste(
    srcCellRange: CellRange,
    dstCellRange: CellRange,
    what: CopyType,
    autofill = false,
    cb: (ri: number, ci: number, cell: CellData) => void = () => {}
  ) {
    const { sri, sci, eri, eci } = srcCellRange;
    const dsri = dstCellRange.sri;
    const dsci = dstCellRange.sci;
    const deri = dstCellRange.eri;
    const deci = dstCellRange.eci;
    const [rn, cn] = srcCellRange.size();
    const [drn, dcn] = dstCellRange.size();
    // console.log(srcIndexes, dstIndexes);
    let isAdd = true;
    let dn = 0;
    if (deri < sri || deci < sci) {
      isAdd = false;
      if (deri < sri) dn = drn;
      else dn = dcn;
    }
    for (let i = sri; i <= eri; i += 1) {
      if (this._[i]) {
        for (let j = sci; j <= eci; j += 1) {
          if (this._[i].cells && this._[i].cells[j]) {
            for (let ii = dsri; ii <= deri; ii += rn) {
              for (let jj = dsci; jj <= deci; jj += cn) {
                const nri = ii + (i - sri);
                const nci = jj + (j - sci);
                const ncell = cloneDeep<CellData>(this._[i].cells[j]);
                // ncell.text
                if (autofill && ncell && ncell.text && ncell.text.length > 0) {
                  const { text } = ncell;
                  let n = jj - dsci + (ii - dsri) + 2;
                  if (!isAdd) {
                    n -= dn + 1;
                  }
                  if (text[0] === "=") {
                    ncell.text = text.replace(
                      /[a-zA-Z]{1,3}\d+/gu,
                      (word: string) => {
                        let [xn, yn] = [0, 0];
                        if (sri === dsri) {
                          xn = n - 1;
                          // if (isAdd) xn -= 1;
                        } else {
                          yn = n - 1;
                        }
                        if (/^\d+$/u.test(word)) return word;
                        return expr2expr(word, xn, yn);
                      }
                    );
                  } else if (
                    (rn <= 1 && cn > 1 && (dsri > eri || deri < sri)) ||
                    (cn <= 1 && rn > 1 && (dsci > eci || deci < sci)) ||
                    (rn <= 1 && cn <= 1)
                  ) {
                    const result = /[\\.\d]+$/u.exec(text);
                    // console.log('result:', result);
                    if (result !== null) {
                      const index = Number(result[0]) + n - 1;
                      ncell.text = text.substring(0, result.index) + index;
                    }
                  }
                }
                this.setCell(nri, nci, ncell, what);
                cb(nri, nci, ncell);
              }
            }
          }
        }
      }
    }
  }

  cutPaste(srcCellRange: CellRange, dstCellRange: CellRange) {
    const ncellmm: Record<number, RowData> = {};
    this.each((ri: string) => {
      this.eachCells(ri, (ci: string) => {
        let nri = parseInt(ri, 10);
        let nci = parseInt(ci, 10);
        if (srcCellRange.includes(nri, nci)) {
          nri = dstCellRange.sri + (nri - srcCellRange.sri);
          nci = dstCellRange.sci + (nci - srcCellRange.sci);
        }
        ncellmm[nri] ??= { cells: {} };
        ncellmm[nri].cells[nci] = this._[nri].cells[ci];
      });
    });
    this._ = ncellmm;
  }

  // src: Array<Array<String>>
  paste(src: string[][], dstCellRange: CellRange) {
    if (src.length <= 0) return;
    const { sri, sci } = dstCellRange;
    src.forEach((row, i) => {
      const ri = sri + i;
      row.forEach((cell, j) => {
        const ci = sci + j;
        this.setCellText(ri, ci, cell);
      });
    });
  }

  insert(sri: number, n = 1) {
    const ndata: Record<number, RowData> = {};
    this.each((ri: string, row: RowData) => {
      let nri = parseInt(ri, 10);
      if (nri >= sri) {
        nri += n;
        this.eachCells(ri, (ci: string, cell) => {
          if (cell.text && cell.text[0] === "=") {
            cell.text = cell.text.replace(/[a-zA-Z]{1,3}\d+/gu, (word) =>
              expr2expr(word, 0, n, (x, y) => y >= sri)
            );
          }
        });
      }
      ndata[nri] = row;
    });
    this._ = ndata;
    this.len += n;
  }

  delete(sri: number, eri: number) {
    const n = eri - sri + 1;
    const ndata: Record<number, RowData> = {};
    this.each((ri: string, row: RowData) => {
      const nri = parseInt(ri, 10);
      if (nri < sri) {
        ndata[nri] = row;
      } else if (nri > eri) {
        ndata[nri - n] = row;
        this.eachCells(ri, (ci, cell) => {
          if (cell.text && cell.text[0] === "=") {
            cell.text = cell.text.replace(/[a-zA-Z]{1,3}\d+/gu, (word) =>
              expr2expr(word, 0, -n, (x, y) => y > eri)
            );
          }
        });
      }
    });
    this._ = ndata;
    this.len -= n;
  }

  insertColumn(sci: number, n = 1) {
    this.each((ri: string, row: RowData) => {
      const rndata: Record<number, CellData> = {};
      this.eachCells(ri, (ci, cell) => {
        let nci = parseInt(ci, 10);
        if (nci >= sci) {
          nci += n;
          if (cell.text && cell.text[0] === "=") {
            cell.text = cell.text.replace(/[a-zA-Z]{1,3}\d+/gu, (word) =>
              expr2expr(word, n, 0, (x) => x >= sci)
            );
          }
        }
        rndata[nci] = cell;
      });
      row.cells = rndata;
    });
  }

  deleteColumn(sci: number, eci: number) {
    const n = eci - sci + 1;
    this.each((ri: string, row: RowData) => {
      const rndata: Record<number, CellData> = {};
      this.eachCells(ri, (ci, cell) => {
        const nci = parseInt(ci, 10);
        if (nci < sci) {
          rndata[nci] = cell;
        } else if (nci > eci) {
          rndata[nci - n] = cell;
          if (cell.text && cell.text[0] === "=") {
            cell.text = cell.text.replace(/[a-zA-Z]{1,3}\d+/gu, (word) =>
              expr2expr(word, -n, 0, (x) => x > eci)
            );
          }
        }
      });
      row.cells = rndata;
    });
  }

  // what: all | text | format | merge
  deleteCells(cellRange: CellRange, what = "all") {
    cellRange.each((i: number, j: number) => {
      this.deleteCell(i, j, what);
    });
  }

  // what: all | text | format | merge
  deleteCell(ri: number, ci: number, what = "all") {
    const row = this.get(ri);
    if (row !== null) {
      const cell = this.getCell(ri, ci);
      if (cell !== null && cell.editable !== false) {
        if (what === "all") {
          delete row.cells[ci];
        } else if (what === "text") {
          if (cell.text) delete cell.text;
          if (cell.value) delete cell.value;
        } else if (what === "format") {
          if (cell.style !== undefined) delete cell.style;
          if (cell.merge) delete cell.merge;
        } else if (what === "merge") {
          if (cell.merge) delete cell.merge;
        }
      }
    }
  }

  maxCell() {
    const keys = Object.keys(this._);
    const ri = keys[keys.length - 1];
    const nri = parseInt(ri, 10);
    const col = this._[nri];
    if (col) {
      const { cells } = col;
      const ks = Object.keys(cells);
      const ci = ks[ks.length - 1];
      return [parseInt(ri, 10), parseInt(ci, 10)];
    }
    return [0, 0];
  }

  each(cb: (ri: string, row: RowData) => void) {
    Object.entries(this._).forEach(([ri, row]) => {
      // TODO: let nri = parseInt(ri, 10);
      cb(ri, row);
    });
  }

  eachCells(ri: string, cb: (i: string, cell: CellData) => void) {
    const nri = parseInt(ri, 10);
    if (this._[nri] && this._[nri].cells) {
      Object.entries(this._[nri].cells).forEach(([ci, cell]) => {
        cb(ci, cell);
      });
    }
  }

  setData(d: RowList) {
    if (d.len) {
      this.len = d.len;
      delete d.len;
    }
    this._ = d;
  }

  getData(): RowList {
    const { len } = this;
    return { len, ...this._ };
  }

  /**
   * Same as getData but exports formula values as text in each cell
   */
  getExportData() {
    const { len } = this;

    const data: RowList = { len, ...this._ };

    // Find all formulas and set 'text' to formula rendered val
    Object.keys(this._).forEach((ri) => {
      const nri = parseInt(ri, 10);
      if (this._[nri] && this._[nri].cells) {
        Object.entries(this._[nri].cells).forEach(([ci, cell]) => {
          const text = cell.text?.toString();
          if (text !== undefined && text.startsWith("=")) {
            // console.log("FORMULA: "+text)
            const renderedText = _cell.render(
              text,
              formulam,
              (y: number, x: number) => this.getCell(x, y)?.text
            );

            data[nri].cells[ci].formula = text;
            data[nri].cells[ci].text = renderedText.toString();
          }
        });
      }
    });

    return data;
  }
}

export default {};
export { Rows };
