/* global window, document */
import Bottombar from "./component/bottombar";
import { h } from "./component/element";
import Sheet from "./component/sheet";
import { cssPrefix } from "./config";
import DataProxy, { DefaultSettings } from "./core/data_proxy";
import { locale } from "./locale/locale";
import "./index.less";
import { type ColProperties } from "./core/col";
import { type RowData } from "./core/row";
import { type Filter, type Sort } from "./core/auto_filter";
import { type LineType } from "./canvas/draw";
import { type SelectType } from "./component/form_select";
import { type OperatorType, type ValidatorType } from "./core/validator";


export type CELL_SELECTED = "cell-selected";
export type CELLS_SELECTED = "cells-selected";
export type CELL_EDITED = "cell-edited";
export type CELL_EDITED_DONE = "cell-edited-done";
export type CellMerge = [number, number];

export interface SpreadsheetEventHandler {
  (
    envt: CELL_SELECTED,
    callback: (cell: CellData, rowIndex: number, colIndex: number) => void,
  ): void;
  (
    envt: CELLS_SELECTED,
    callback: (
      cell: CellData,
      parameters: { sri: number; sci: number; eri: number; eci: number },
    ) => void,
  ): void;
  (
    evnt: CELL_EDITED,
    callback: (text: string, rowIndex: number, colIndex: number) => void,
  ): void;
  (
    evnt: CELL_EDITED_DONE,
    callback: (text: string, rowIndex: number, colIndex: number) => void,
  ): void;
}



/**
 * Data for representing a cell
 */
export interface CellData {
  text?: string;
  value?:string;
  style?: number;
  merge?: CellMerge;
  editable?: boolean;
  formula?:string;
}


export interface ColList {
    len?: number;
    [key: number]: ColProperties;
}

export interface RowList {
  len?:number;
  [key: number]: RowData;
}

/**
 * Data for representing a sheet
 */
export interface SheetData {
  name: string;
  freeze?: string;
  styles?: CellStyle[];
  merges?: string[];
  validations?:{
    refs: string[];
    mode: SelectType;
    type: ValidatorType;
    required: boolean;
    operator: OperatorType;
    value: string;
}[];
  autofilter:{ ref:string, filters:Filter[], sort:Sort };
  cols?: ColList
  rows?: RowList;
}

/**
 * Data for representing a spreadsheet
 */
export interface SpreadsheetData {
  [index: number]: SheetData;
}

export interface CellStyle {
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  font?: {
    bold?: boolean;
  };
  bgcolor?: string;
  textwrap?: boolean;
  color?: string;
  border?: {
    top?: [LineType, string] | null;
    right?: [LineType, string] | null;
    bottom?: [LineType, string] | null;
    left?: [LineType, string] | null;
  };
}

export default class Spreadsheet {
  options: Partial<DefaultSettings>;
  sheetIndex: number;
  datas: DataProxy[];
  data: DataProxy;
  sheet: Sheet;
  bottombar: Bottombar | null;

  constructor(selectors:string | Element, options = {}) {
    let targetEl = typeof selectors === "string"? document.querySelector(selectors): selectors;
    if(targetEl === null){
      throw new Error(`Selector ${selectors} was not found`);
    }

    this.options = { showBottomBar: true, ...options };
    this.sheetIndex = 1;
    this.datas = [];

    this.bottombar = this.options.showBottomBar
      ? new Bottombar(
          () => {
            if (this.options.mode === "read") return;
            const d = this.addSheet();
            this.sheet.resetData(d);
          },
          (index: number) => {
            const d = this.datas[index];
            this.sheet.resetData(d);
          },
          () => {
            this.deleteSheet();
          },
          (index, value) => {
            this.datas[index].name = value;
            this.sheet.trigger("change");
          }
        )
      : null;
    this.data = this.addSheet();
    const rootEl = h("div", `${cssPrefix}`).on("contextmenu", (evt) =>
      evt.preventDefault()
    );
    // create canvas element
    targetEl.appendChild(rootEl.el);
    this.sheet = new Sheet(rootEl, this.data);
    if (this.bottombar !== null) {
      rootEl.child(this.bottombar.el);
    }
  }

  addSheet(name?:string, active = true) {
    const n = name || `sheet${this.sheetIndex}`;
    const d = new DataProxy(n, this.options);
    d.change = (...args:unknown[]) => {
      this.sheet.trigger("change", ...args);
    };
    this.datas.push(d);
    // console.log('d:', n, d, this.datas);
    if (this.bottombar !== null) {
      this.bottombar.addItem(n, active, this.options);
    }
    this.sheetIndex += 1;
    return d;
  }

  deleteSheet() {
    if (this.bottombar === null) return;

    const [oldIndex, nindex] = this.bottombar.deleteItem();
    if (oldIndex >= 0) {
      this.datas.splice(oldIndex, 1);
      if (nindex >= 0) this.sheet.resetData(this.datas[nindex]);
      this.sheet.trigger("change");
    }
  }

  loadData(data:SheetData|SheetData[]) {
    const ds = Array.isArray(data) ? data : [data];
    if (this.bottombar !== null) {
      this.bottombar.clear();
    }
    this.datas = [];
    if (ds.length > 0) {
      for (let i = 0; i < ds.length; i += 1) {
        const it = ds[i];
        const nd = this.addSheet(it.name, i === 0);
        nd.setData(it);
        if (i === 0) {
          this.sheet.resetData(nd);
        }
      }
    }
    return this;
  }

  getData() {
    return this.datas.map((it) => it.getData());
  }

  /**
   * Same as getData but exports formula values as text in each cell
   */
  exportValues() {
    const data = this.getData();
    data.forEach((sheet, i)=>{
      sheet.rows = this.datas[i].rows.getExportData();
    });

    return data;
  }

  cellText(ri:number, ci:number, text:string, sheetIndex = 0) {
    this.datas[sheetIndex].setCellText(ri, ci, text, "finished");
    return this;
  }

  cell(ri:number, ci:number, sheetIndex = 0) {
    return this.datas[sheetIndex].getCell(ri, ci);
  }

  cellStyle(ri:number, ci:number, sheetIndex = 0) {
    return this.datas[sheetIndex].getCellStyle(ri, ci);
  }

  reRender() {
    this.sheet.table.render();
    return this;
  }

  on(eventName:string, func:Function) {
    this.sheet.on(eventName, func);
    return this;
  }

  validate() {
    const { validations } = this.data;
    return validations.errors.size <= 0;
  }

  change(cb:Function) {
    this.sheet.on("change", cb);
    return this;
  }

  freeze(sheetIndex:number, ri:number, ci:number) {
    this.datas[sheetIndex].setFreeze(ri, ci);
    // this.sheet.freeze(ri, ci)
    return this;
  }

  static locale(lang:string, message:Record<string,unknown>) {
    locale(lang, message);
  }
}

export const spreadsheet = (el:Element, options = {}) => new Spreadsheet(el, options);

if (window) {
  //@ts-expect-error
  window.x_spreadsheet = spreadsheet;
  //@ts-expect-error
  window.x_spreadsheet.locale = (lang, message) => locale(lang, message);
}