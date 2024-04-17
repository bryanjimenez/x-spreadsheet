/* global document */

import Selector from './selector';
import Scroll from './scroll';
import History from './history';
import Clipboard from './clipboard';
import AutoFilter from './auto_filter';
import { Merges } from './merge';
import helper from './helper';
import { Rows } from './row';
import { Cols } from './col';
import { Validations } from './validation';
import { CellRange, CellRangePoints, CellRef } from './cell_range';
import { expr2xy, xy2expr } from './alphabet';
import { t } from '../locale/locale';
import { type CellData, type SheetData } from '..';
import { type ExtendToolbarOption, type ToolBarChangeType } from '../component/toolbar/index';
import { type HAlign, type VAlign, type LineType } from '../canvas/draw';
import type Validator from './validator';
import { type BorderType } from '../component/border_palette';
import { SelectType } from '../component/form_select';

interface BSS {
  top?: string[]; bottom?: string[]; left?: string[]; right?: string[]; 
}

export type BorderEdit = {
  mode: BorderType;
  style: string;
  color: string;
}

export type CopyType = "text" | "all" | "format";

export interface DefaultSettings {
  mode: 'edit'|'read',
  view: {
    height: () => number,
    width: () => number,
  },
  showGrid: boolean,
  showToolbar: boolean,
  showContextmenu: boolean,
  showBottomBar: boolean,
  row: {
    len: number,
    height: number,
  },
  col: {
    len: number,
    width: number,
    indexWidth: number,
    minWidth: number,
  },
  style: {
    bgcolor: string,
    align: HAlign
    valign: VAlign
    textwrap: boolean,
    strike: boolean,
    underline: boolean,
    color: string,
    //"border":{"top":["thin","#0366d6"],"bottom":["thin","#0366d6"],"right":["thin","#0366d6"],"left":["thin","#0366d6"]}
    border: {
      top: [LineType, string] | null;
      bottom: [LineType, string] | null;
      left: [LineType, string] | null;
      right: [LineType, string] | null;
    },
    font: {
      name: string,
      size: number,
      bold: boolean,
      italic: boolean,
    },
    // format: {
    //   mode: string;
    //   style: string;
    //   color: string;
    // },
    format: 'normal'|'text'|'number'|'percent'|'rmb'|'usd'|'eur'|'date'|'time'|'datetime'|'duration';
  },
  evalPaused?: boolean;
  extendToolbar?: {
        left?: ExtendToolbarOption[];
        right?: ExtendToolbarOption[];
  };
}
const defaultSettings = {
  mode: 'edit', // edit | read
  view: {
    height: () => document.documentElement.clientHeight,
    width: () => document.documentElement.clientWidth,
  },
  showGrid: true,
  showToolbar: true,
  showContextmenu: true,
  showBottomBar: true,
  row: {
    len: 100,
    height: 25,
  },
  col: {
    len: 26,
    width: 100,
    indexWidth: 60,
    minWidth: 60,
  },
  style: {
    bgcolor: '#ffffff',
    align: 'left',
    valign: 'middle',
    textwrap: false,
    strike: false,
    underline: false,
    color: '#0a0a0a',
    //"border":{"top":["thin","#0366d6"],"bottom":["thin","#0366d6"],"right":["thin","#0366d6"],"left":["thin","#0366d6"]}
    font: {
      name: 'Arial',
      size: 10,
      bold: false,
      italic: false,
    },
    format: 'normal',
  },
};

const toolbarHeight = 41;
const bottombarHeight = 41;


export default class DataProxy {
  name:string;
  freeze: number[];
  styles: ReturnType<DataProxy['defaultStyle']>[];

  merges: Merges;
  rows: Rows;
  cols: Cols;
  validations: Validations;

  hyperlinks: Record<string,string>
  comments: Record<string,string>
  settings: DefaultSettings;
  selector: Selector;
  scroll: {x:number, y:number, ri:number, ci:number};
  history: History;
  clipboard: Clipboard;
  autoFilter: AutoFilter;
  change: Function;
  exceptRowSet: Set<number>;
  sortedRowMap: Map<number, number>;
  unsortedRowMap: Map<number, number>;

  constructor(name:string, settings: Partial<DefaultSettings>) {
    this.settings = helper.merge<DefaultSettings>(defaultSettings, settings || {});
    // save data begin
    this.name = name || 'sheet';
    this.freeze = [0, 0];
    this.styles = []; // Array<Style>
    this.merges = new Merges(); // [CellRange, ...]
    this.rows = new Rows(this.settings.row);
    this.cols = new Cols(this.settings.col);
    this.validations = new Validations();
    this.hyperlinks = {};
    this.comments = {};
    // save data end

    // don't save object
    this.selector = new Selector();
    this.scroll = new Scroll();
    this.history = new History();
    this.clipboard = new Clipboard();
    this.autoFilter = new AutoFilter();
    this.change = () => {};
    this.exceptRowSet = new Set();
    this.sortedRowMap = new Map();
    this.unsortedRowMap = new Map();
  }


private canPaste(src:CellRange, dst:CellRange, error = (msg: string) => {}) {
  const { merges } = this;
  const cellRange = dst.clone();
  const [srn, scn] = src.size();
  const [drn, dcn] = dst.size();
  if (srn > drn) {
    cellRange.eri = dst.sri + srn - 1;
  }
  if (scn > dcn) {
    cellRange.eci = dst.sci + scn - 1;
  }
  if (merges.intersects(cellRange)) {
    error(t('error.pasteForMergedCell'));
    return false;
  }
  return true;
}
private copyPaste(srcCellRange:CellRange, dstCellRange:CellRange, what: CopyType, autofill = false) {
  const { rows, merges } = this;
  // delete dest merge
  if (what === 'all' || what === 'format') {
    rows.deleteCells(dstCellRange, what);
    merges.deleteWithin(dstCellRange);
  }
  rows.copyPaste(srcCellRange, dstCellRange, what, autofill, (ri:number, ci:number, cell:CellData) => {
    if (cell && cell.merge) {
      // console.log('cell:', ri, ci, cell);
      const [rn, cn] = cell.merge;
      if (rn <= 0 && cn <= 0) return;
      merges.add(new CellRange(ri, ci, ri + rn, ci + cn));
    }
  });
}

private cutPaste(srcCellRange:CellRange, dstCellRange:CellRange) {
  const { clipboard, rows, merges } = this;
  rows.cutPaste(srcCellRange, dstCellRange);
  merges.move(srcCellRange,
    dstCellRange.sri - srcCellRange.sri,
    dstCellRange.sci - srcCellRange.sci);
  clipboard.clear();
}


// bss: { top, bottom, left, right }
private setStyleBorder(ri:number, ci:number, bss:BSS ) {
  const { styles, rows } = this;
  const cell = rows.getCellOrNew(ri, ci);
  let cstyle:Partial<DefaultSettings['style']> = {};
  if (cell.style !== undefined) {
    cstyle = helper.cloneDeep(styles[cell.style]);
  }
  cstyle = helper.merge<DefaultSettings['style']>(cstyle, { border: bss });
  cell.style = this.addStyle(cstyle);
}

private setStyleBorders({ mode, style, color }:{ mode:BorderType, style:string, color:string }) {
  const { styles, selector, rows } = this;
  const {
    sri, sci, eri, eci,
  } = selector.range;
  const multiple = !this.isSingleSelected();
  if (!multiple) {
    if (mode === 'inside' || mode === 'horizontal' || mode === 'vertical') {
      return;
    }
  }
  if (mode === 'outside' && !multiple) {
    this.setStyleBorder(sri, sci, {
      top: [style, color], bottom: [style, color], left: [style, color], right: [style, color],
    });
  } else if (mode === 'none') {
    selector.range.each((ri:number, ci:number) => {
      const cell = rows.getCell(ri, ci);
      if (cell && cell.style !== undefined) {
        const ns = helper.cloneDeep(styles[cell.style]);
        delete ns.border;
        // ['bottom', 'top', 'left', 'right'].forEach((prop) => {
        //   if (ns[prop]) delete ns[prop];
        // });
        cell.style = this.addStyle(ns);
      }
    });
  } else if (mode === 'all' || mode === 'inside' || mode === 'outside'
    || mode === 'horizontal' || mode === 'vertical') {
    const merges:[number,number,number,number][] = [];
    for (let ri = sri; ri <= eri; ri += 1) {
      for (let ci = sci; ci <= eci; ci += 1) {
        // jump merges -- start
        const mergeIndexes = [];
        for (let ii = 0; ii < merges.length; ii += 1) {
          const [mri, mci, rn, cn] = merges[ii];
          if (ri === mri + rn + 1) mergeIndexes.push(ii);
          if (mri <= ri && ri <= mri + rn) {
            if (ci === mci) {
              ci += cn + 1;
              break;
            }
          }
        }
        mergeIndexes.forEach(it => merges.splice(it, 1));
        if (ci > eci) break;
        // jump merges -- end
        const cell = rows.getCell(ri, ci);
        let [rn, cn] = [0, 0];
        if (cell && cell.merge) {
          [rn, cn] = cell.merge;
          merges.push([ri, ci, rn, cn]);
        }
        const mrl = rn > 0 && ri + rn === eri;
        const mcl = cn > 0 && ci + cn === eci;
        let bss:BSS = {};
        if (mode === 'all') {
          bss = {
            bottom: [style, color],
            top: [style, color],
            left: [style, color],
            right: [style, color],
          };
        } else if (mode === 'inside') {
          if (!mcl && ci < eci) bss.right = [style, color];
          if (!mrl && ri < eri) bss.bottom = [style, color];
        } else if (mode === 'horizontal') {
          if (!mrl && ri < eri) bss.bottom = [style, color];
        } else if (mode === 'vertical') {
          if (!mcl && ci < eci) bss.right = [style, color];
        } else if (mode === 'outside' && multiple) {
          if (sri === ri) bss.top = [style, color];
          if (mrl || eri === ri) bss.bottom = [style, color];
          if (sci === ci) bss.left = [style, color];
          if (mcl || eci === ci) bss.right = [style, color];
        }
        if (Object.keys(bss).length > 0) {
          this.setStyleBorder(ri, ci, bss);
        }
        ci += cn;
      }
    }
  } else if (mode === 'top' || mode === 'bottom') {
    for (let ci = sci; ci <= eci; ci += 1) {
      if (mode === 'top') {
        this.setStyleBorder(sri, ci, { top: [style, color] });
        ci += rows.getCellMerge(sri, ci)[1];
      }
      if (mode === 'bottom') {
        this.setStyleBorder(eri, ci, { bottom: [style, color] });
        ci += rows.getCellMerge(eri, ci)[1];
      }
    }
  } else if (mode === 'left' || mode === 'right') {
    for (let ri = sri; ri <= eri; ri += 1) {
      if (mode === 'left') {
        this.setStyleBorder(ri, sci, { left: [style, color] });
        ri += rows.getCellMerge(ri, sci)[0];
      }
      if (mode === 'right') {
        this.setStyleBorder(ri, eci, { right: [style, color] });
        ri += rows.getCellMerge(ri, eci)[0];
      }
    }
  }
}

private getCellRowByY(y:number, scrollOffsety:number) {
  const { rows } = this;
  const fsh = this.freezeTotalHeight();
  // console.log('y:', y, ', fsh:', fsh);
  let inits = rows.height;
  if (fsh + rows.height < y) inits -= scrollOffsety;

  // handle ri in autofilter
  const frset = this.exceptRowSet;

  let ri = 0;
  let top = inits;
  let { height } = rows;
  for (; ri < rows.len; ri += 1) {
    if (top > y) break;
    if (!frset.has(ri)) {
      height = rows.getHeight(ri);
      top += height;
    }
  }
  top -= height;
  // console.log('ri:', ri, ', top:', top, ', height:', height);

  if (top <= 0) {
    return { ri: -1, top: 0, height };
  }

  return { ri: ri - 1, top, height };
}

private getCellColByX(x:number, scrollOffsetx:number) {
  const { cols } = this;
  const fsw = this.freezeTotalWidth();
  let inits = cols.indexWidth;
  if (fsw + cols.indexWidth < x) inits -= scrollOffsetx;
  const [ci, left, width] = helper.rangeReduceIf(
    0,
    cols.len,
    inits,
    cols.indexWidth,
    x,
    i => cols.getWidth(i),
  );
  if (left <= 0) {
    return { ci: -1, left: 0, width: cols.indexWidth };
  }
  return { ci: ci - 1, left, width };
}


  addValidation(mode:any, ref:any, validator:any) {
    // console.log('mode:', mode, ', ref:', ref, ', validator:', validator);
    this.changeData(() => {
      this.validations.add(mode, ref, validator);
    });
  }

  removeValidation() {
    const { range } = this.selector;
    this.changeData(() => {
      this.validations.remove(range);
    });
  }

  getSelectedValidator() {
    const { ri, ci } = this.selector;
    const v = this.validations.get(ri, ci);
    return v ? v.validator : null;
  }

  getSelectedValidation() {
    const { ri, ci, range } = this.selector;
    const v = this.validations.get(ri, ci);
    const ret:{ mode?:SelectType, ref:CellRef, validator?:Validator } = { ref:range.toString() };
    if (v !== null) {
      ret.mode = v.mode;
      ret.validator = v.validator;
    }
    return ret;
  }

  canUndo() {
    return this.history.canUndo();
  }

  canRedo() {
    return this.history.canRedo();
  }

  undo() {
    this.history.undo(this.getData(), (d:SheetData) => {
      this.setData(d);
    });
  }

  redo() {
    this.history.redo(this.getData(), (d:SheetData) => {
      this.setData(d);
    });
  }

  copy() {
    this.clipboard.copy(this.selector.range);
  }

  copyToSystemClipboard(evt:ClipboardEvent) {
    let copyText:string[][] = [];
    const {
      sri, eri, sci, eci,
    } = this.selector.range;

    for (let ri = sri; ri <= eri; ri += 1) {
      const row = [];
      for (let ci = sci; ci <= eci; ci += 1) {
        const cell = this.getCell(ri, ci);
        row.push((cell && cell.text) || '');
      }
      copyText.push(row);
    }

    // Adding \n and why not adding \r\n is to support online office and client MS office and WPS
    const copyTextStr = copyText.map(row => row.join('\t')).join('\n');

    // why used this
    // cuz http protocol will be blocked request clipboard by browser
    if (evt) {
      if(evt.clipboardData){
        evt.clipboardData.clearData();
        evt.clipboardData.setData('text/plain', copyTextStr);
      }
      evt.preventDefault();
    }

    // this need https protocol
    /* global navigator */
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyTextStr).then(() => {}, (err) => {
        console.log('text copy to the system clipboard error  ', copyText, err);
      });
    }
  }

  cut() {
    this.clipboard.cut(this.selector.range);
  }

  paste(what:CopyType = 'all', error = (msg: string) => {}) {
    // console.log('sIndexes:', sIndexes);
    const { clipboard, selector } = this;
    if (clipboard.isClear()) return false;
    if (clipboard.isNotClear() && !this.canPaste(clipboard.range, selector.range, error)) return false;

    this.changeData(() => {
      if (clipboard.isCopy()) {
        this.copyPaste(clipboard.range, selector.range, what);
      } else if (clipboard.isCut()) {
        this.cutPaste(clipboard.range, selector.range);
      }
    });
    return true;
  }

  pasteFromSystemClipboard(resetSheet:Function, eventTrigger:Function) {
    const { selector } = this;
    if(!('readText' in navigator.clipboard)){
      console.log('text paste from the system clipboard error (HTTPS)');
      return;
    }
    navigator.clipboard.readText().then((content) => {
      const contentToPaste = this.parseClipboardContent(content);
      let startRow = selector.ri;
      contentToPaste.forEach((row) => {
        let startColumn = selector.ci;
        row.forEach((cellContent) => {
          this.setCellText(startRow, startColumn, cellContent, 'input');
          startColumn += 1;
        });
        startRow += 1;
      });
      resetSheet();
      eventTrigger(this.rows.getData());
    },(err) => {
      console.log('text paste from the system clipboard error  ', err);
    });
  }

  parseClipboardContent(clipboardContent:string) {
    const parsedData:string[][] = [];

    // first we need to figure out how many rows we need to paste
    const rows = clipboardContent.split('\n');

    // for each row parse cell data
    let i = 0;
    rows.forEach((row) => {
      parsedData[i] = row.split('\t');
      i += 1;
    });
    return parsedData;
  }

  pasteFromText(txt:string) {
    let lines:string[][] = [];

    if (/\r\n/.test(txt)) lines = txt.split('\r\n').map(it => it.replace(/"/g, '').split('\t'));
    else lines = txt.split('\n').map(it => it.replace(/"/g, '').split('\t'));

    if (lines.length) {
      const { rows, selector } = this;

      this.changeData(() => {
        rows.paste(lines, selector.range);
      });
    }
  }

  autofill(cellRange:CellRange, what:CopyType, error = (msg:string) => {}) {
    const srcRange = this.selector.range;
    if (!this.canPaste(srcRange, cellRange, error)) return false;
    this.changeData(() => {
      this.copyPaste(srcRange, cellRange, what, true);
    });
    return true;
  }

  clearClipboard() {
    this.clipboard.clear();
  }

  calSelectedRangeByEnd(ri:number, ci:number) {
    const {
      selector, rows, cols, merges,
    } = this;
    let {
      sri, sci, eri, eci,
    } = selector.range;
    const cri = selector.ri;
    const cci = selector.ci;
    let [nri, nci] = [ri, ci];
    if (ri < 0) nri = rows.len - 1;
    if (ci < 0) nci = cols.len - 1;
    if (nri > cri) [sri, eri] = [cri, nri];
    else [sri, eri] = [nri, cri];
    if (nci > cci) [sci, eci] = [cci, nci];
    else [sci, eci] = [nci, cci];
    selector.range = merges.union(new CellRange(
      sri, sci, eri, eci,
    ));
    selector.range = merges.union(selector.range);
    // console.log('selector.range:', selector.range);
    return selector.range;
  }

  calSelectedRangeByStart(ri:number, ci:number) {
    const {
      selector, rows, cols, merges,
    } = this;
    let cellRange = merges.getFirstIncludes(ri, ci);
    // console.log('cellRange:', cellRange, ri, ci, merges);
    if (cellRange === null) {
      cellRange = new CellRange(ri, ci, ri, ci);
      if (ri === -1) {
        cellRange.sri = 0;
        cellRange.eri = rows.len - 1;
      }
      if (ci === -1) {
        cellRange.sci = 0;
        cellRange.eci = cols.len - 1;
      }
    }
    selector.range = cellRange;
    return cellRange;
  }

  setSelectedCellAttr(property:'merge', value:string):void;
  setSelectedCellAttr(property:'printable', value:boolean):void;
  setSelectedCellAttr(property:'editable', value:boolean):void;
  setSelectedCellAttr(property:'border', value:BorderEdit):void;
  setSelectedCellAttr(property:ToolBarChangeType, value:boolean|string|BorderEdit) {
    this.changeData(() => {
      const { selector, styles, rows } = this;
      if (property === 'merge') {
        if (value) this.merge();
        else this.unmerge();
      } else if (property === 'border' && typeof value !== 'boolean'&& typeof value !== 'string') {
        this.setStyleBorders(value);
      } else if (property === 'formula') {
        // console.log('>>>', selector.multiple());
        const { ri, ci, range } = selector;
        if (selector.multiple()) {
          const [rn, cn] = selector.size();
          const {
            sri, sci, eri, eci,
          } = range;
          if (rn > 1) {
            for (let i = sci; i <= eci; i += 1) {
              const cell = rows.getCellOrNew(eri + 1, i);
              cell.text = `=${value}(${xy2expr(i, sri)}:${xy2expr(i, eri)})`;
            }
          } else if (cn > 1) {
            const cell = rows.getCellOrNew(ri, eci + 1);
            cell.text = `=${value}(${xy2expr(sci, ri)}:${xy2expr(eci, ri)})`;
          }
        } else {
          const cell = rows.getCellOrNew(ri, ci);
          cell.text = `=${value}()`;
        }
      } else {
        selector.range.each((ri:number, ci:number) => {
          const cell = rows.getCellOrNew(ri, ci);
          let cstyle:Partial<DefaultSettings['style']> = {};
          if (cell.style !== undefined) {
            cstyle = helper.cloneDeep(styles[cell.style]);
          }
          if (property === 'format') {
            cstyle.format = value;
            cell.style = this.addStyle(cstyle);
          } else if (property === 'font-bold' || property === 'font-italic'
            || property === 'font-name' || property === 'font-size') {
            const nfont:Partial<DefaultSettings['style']['font']> = {};
            nfont[property.split('-')[1]] = value;
            cstyle.font = Object.assign(cstyle.font || {}, nfont);
            cell.style = this.addStyle(cstyle);
          } else if (property === 'strike' || property === 'textwrap'
            || property === 'underline'
            || property === 'align' || property === 'valign'
            || property === 'color' || property === 'bgcolor') {
            cstyle[property] = value;
            cell.style = this.addStyle(cstyle);
          } else {
            cell[property] = value;
          }
        });
      }
    });
  }

  // state: input | finished
  setSelectedCellText(text:string, state = 'input') {
    const { autoFilter, selector, rows } = this;
    const { ri, ci } = selector;
    let nri = ri;
    if (this.unsortedRowMap.has(ri)) {
      nri = this.unsortedRowMap.get(ri);
    }
    const oldCell = rows.getCell(nri, ci);
    const oldText = oldCell ? oldCell.text : '';
    this.setCellText(nri, ci, text, state);
    // replace filter.value
    if (autoFilter.active()) {
      const filter = autoFilter.getFilter(ci);
      if (filter) {
        const vIndex = filter.value.findIndex(v => v === oldText);
        if (vIndex >= 0) {
          filter.value.splice(vIndex, 1, text);
        }
        // console.log('filter:', filter, oldCell);
      }
    }
    // this.resetAutoFilter();
  }

  getSelectedCell() {
    const { ri, ci } = this.selector;
    let nri = ri;
    if (this.unsortedRowMap.has(ri)) {
      const value = this.unsortedRowMap.get(ri);
      if(value){
        nri = value
      }
    }
    return this.rows.getCell(nri, ci);
  }

  xyInSelectedRect(x:number, y:number) {
    const {
      left, top, width, height,
    } = this.getSelectedRect();
    if(left===undefined || top ===undefined || width===undefined || height===undefined){
       throw new Error("getSelectedRect should not return undefined");
    }
    const x1 = x - this.cols.indexWidth;
    const y1 = y - this.rows.height;
    // console.log('x:', x, ',y:', y, 'left:', left, 'top:', top);
    return x1 > left && x1 < (left + width)
      && y1 > top && y1 < (top + height);
  }

  getSelectedRect() {
    return this.getRect(this.selector.range);
  }

  getClipboardRect() {
    const { clipboard } = this;
    if (clipboard.isNotClear()) {
      return this.getRect(clipboard.range);
    }
    return { left: -100, top: -100 };
  }

  getRect(cellRange:CellRange): {left:number, top:number, width?:number, height?:number, scroll?:{ x: number; y: number; ri: number; ci: number; }, l:number, t:number} {
    const {
      scroll, rows, cols, exceptRowSet,
    } = this;
    const {
      sri, sci, eri, eci,
    } = cellRange;
    // console.log('sri:', sri, ',sci:', sci, ', eri:', eri, ', eci:', eci);
    // no selector
    if (sri < 0 && sci < 0) {
      return {
        left: 0, l: 0, top: 0, t: 0, scroll,
      };
    }
    const left = cols.sumWidth(0, sci);
    const top = rows.sumHeight(0, sri, exceptRowSet);
    const height = rows.sumHeight(sri, eri + 1, exceptRowSet);
    const width = cols.sumWidth(sci, eci + 1);
    // console.log('sri:', sri, ', sci:', sci, ', eri:', eri, ', eci:', eci);
    let left0 = left - scroll.x;
    let top0 = top - scroll.y;
    const fsh = this.freezeTotalHeight();
    const fsw = this.freezeTotalWidth();
    if (fsw > 0 && fsw > left) {
      left0 = left;
    }
    if (fsh > 0 && fsh > top) {
      top0 = top;
    }
    return {
      l: left,
      t: top,
      left: left0,
      top: top0,
      height,
      width,
      scroll,
    };
  }

  getCellRectByXY(x:number, y:number) {
    const {
      scroll, merges, rows, cols,
    } = this;
    let { ri, top, height } = this.getCellRowByY(y, scroll.y);
    let { ci, left, width } = this.getCellColByX(x, scroll.x);
    if (ci === -1) {
      width = cols.totalWidth();
    }
    if (ri === -1) {
      height = rows.totalHeight();
    }
    if (ri >= 0 || ci >= 0) {
      const merge = merges.getFirstIncludes(ri, ci);
      if (merge) {
        ri = merge.sri;
        ci = merge.sci;
        ({
          left, top, width, height,
        } = this.cellRect(ri, ci));
      }
    }
    return {
      ri, ci, left, top, width, height,
    };
  }

  isSingleSelected() {
    const {
      sri, sci, eri, eci,
    } = this.selector.range;
    const cell = this.getCell(sri, sci);
    if (cell && cell.merge) {
      const [rn, cn] = cell.merge;
      if (sri + rn === eri && sci + cn === eci) return true;
    }
    return !this.selector.multiple();
  }

  canUnmerge() {
    const {
      sri, sci, eri, eci,
    } = this.selector.range;
    const cell = this.getCell(sri, sci);
    if (cell && cell.merge) {
      const [rn, cn] = cell.merge;
      if (sri + rn === eri && sci + cn === eci) return true;
    }
    return false;
  }

  merge() {
    const { selector, rows } = this;
    if (this.isSingleSelected()) return;
    const [rn, cn] = selector.size();
    // console.log('merge:', rn, cn);
    if (rn > 1 || cn > 1) {
      const { sri, sci } = selector.range;
      this.changeData(() => {
        const cell = rows.getCellOrNew(sri, sci);
        cell.merge = [rn - 1, cn - 1];
        this.merges.add(selector.range);
        // delete merge cells
        this.rows.deleteCells(selector.range);
        // console.log('cell:', cell, this.d);
        this.rows.setCell(sri, sci, cell);
      });
    }
  }

  unmerge() {
    const { selector } = this;
    if (!this.isSingleSelected()) return;
    const { sri, sci } = selector.range;
    this.changeData(() => {
      this.rows.deleteCell(sri, sci, 'merge');
      this.merges.deleteWithin(selector.range);
    });
  }

  canAutofilter() {
    return !this.autoFilter.active();
  }

  autofilter() {
    const { autoFilter, selector } = this;
    this.changeData(() => {
      if (autoFilter.active()) {
        autoFilter.clear();
        this.exceptRowSet = new Set();
        this.sortedRowMap = new Map();
        this.unsortedRowMap = new Map();
      } else {
        autoFilter.ref = selector.range.toString();
      }
    });
  }

  setAutoFilter(ci:number, order:any, operator:any, value:string[]) {
    const { autoFilter } = this;
    autoFilter.addFilter(ci, operator, value);
    autoFilter.setSort(ci, order);
    this.resetAutoFilter();
  }

  resetAutoFilter() {
    const { autoFilter, rows } = this;
    if (!autoFilter.active()) return;
    const { sort } = autoFilter;
    const { rset, fset } = autoFilter.filteredRows((r, c) => rows.getCell(r, c));
    const fary = Array.from(fset);
    const oldAry = Array.from(fset);
    if (sort) {
      fary.sort((a, b) => {
        if (sort.order === 'asc') return a - b;
        if (sort.order === 'desc') return b - a;
        return 0;
      });
    }
    this.exceptRowSet = rset;
    this.sortedRowMap = new Map();
    this.unsortedRowMap = new Map();
    fary.forEach((it, index) => {
      this.sortedRowMap.set(oldAry[index], it);
      this.unsortedRowMap.set(it, oldAry[index]);
    });
  }

  deleteCell(what:CopyType = 'all') {
    const { selector } = this;
    this.changeData(() => {
      this.rows.deleteCells(selector.range, what);
      if (what === 'all' || what === 'format') {
        this.merges.deleteWithin(selector.range);
      }
    });
  }

  // type: row | column
  insert(type:'row'|'column', n = 1) {
    this.changeData(() => {
      const { sri, sci } = this.selector.range;
      const { rows, merges, cols } = this;
      let si = sri;
      if (type === 'row') {
        rows.insert(sri, n);
      } else if (type === 'column') {
        rows.insertColumn(sci, n);
        si = sci;
        cols.len += n;
        Object.keys(cols._).reverse().forEach((colIndex) => {
          const col = parseInt(colIndex, 10);
          if (col >= sci) {
            cols._[col + n] = cols._[col];
            delete cols._[col];
          }
        });
      }
      merges.shift(type, si, n, (ri:number, ci:number, rn:number, cn:number) => {
        const cell = rows.getCell(ri, ci);
        if(cell && cell.merge){
          const [r,c] = cell.merge
          cell.merge = [r+rn,c+cn];
        }
      });
    });
  }

  // type: row | column
  delete(type:'row'|'column') {
    this.changeData(() => {
      const {
        rows, merges, selector, cols,
      } = this;
      const { range } = selector;
      const {
        sri, sci, eri, eci,
      } = selector.range;
      const [rsize, csize] = selector.range.size();
      let si = sri;
      let size = rsize;
      if (type === 'row') {
        rows.delete(sri, eri);
      } else if (type === 'column') {
        rows.deleteColumn(sci, eci);
        si = range.sci;
        size = csize;
        cols.len -= (eci - sci + 1);
        Object.keys(cols._).forEach((colIndex) => {
          const col = parseInt(colIndex, 10);
          if (col >= sci) {
            if (col > eci) cols._[col - (eci - sci + 1)] = cols._[col];
            delete cols._[col];
          }
        });
      }
      // console.log('type:', type, ', si:', si, ', size:', size);
      merges.shift(type, si, -size, (ri:number, ci:number, rn:number, cn:number) => {
        // console.log('ri:', ri, ', ci:', ci, ', rn:', rn, ', cn:', cn);
        const cell = rows.getCell(ri, ci);
        if(cell && cell.merge){
          const [r,c] = cell.merge
          cell.merge = [r+rn,c+cn];

          if (cell.merge[0] === 0 && cell.merge[1] === 0) {
            delete cell.merge;
          }
        }
      });
    });
  }

  scrollx(x:number, cb:Function) {
    const { scroll, freeze, cols } = this;
    const [, fci] = freeze;
    const [
      ci, left, width,
    ] = helper.rangeReduceIf(fci, cols.len, 0, 0, x, i => cols.getWidth(i));
    // console.log('fci:', fci, ', ci:', ci);
    let x1 = left;
    if (x > 0) x1 += width;
    if (scroll.x !== x1) {
      scroll.ci = x > 0 ? ci : 0;
      scroll.x = x1;
      cb();
    }
  }

  scrolly(y:number, cb:Function) {
    const { scroll, freeze, rows } = this;
    const [fri] = freeze;
    const [
      ri, top, height,
    ] = helper.rangeReduceIf(fri, rows.len, 0, 0, y, i => rows.getHeight(i));
    let y1 = top;
    if (y > 0) y1 += height;
    // console.log('ri:', ri, ' ,y:', y1);
    if (scroll.y !== y1) {
      scroll.ri = y > 0 ? ri : 0;
      scroll.y = y1;
      cb();
    }
  }

  cellRect(ri:number, ci:number) {
    const { rows, cols } = this;
    const left = cols.sumWidth(0, ci);
    const top = rows.sumHeight(0, ri);
    const cell = rows.getCell(ri, ci);
    let width = cols.getWidth(ci);
    let height = rows.getHeight(ri);
    if (cell !== null) {
      if (cell.merge) {
        const [rn, cn] = cell.merge;
        // console.log('cell.merge:', cell.merge);
        if (rn > 0) {
          for (let i = 1; i <= rn; i += 1) {
            height += rows.getHeight(ri + i);
          }
        }
        if (cn > 0) {
          for (let i = 1; i <= cn; i += 1) {
            width += cols.getWidth(ci + i);
          }
        }
      }
    }
    // console.log('data:', this.d);
    return {
      left, top, width, height, cell,
    };
  }

  getCell(ri:number, ci:number) {
    return this.rows.getCell(ri, ci);
  }

  getCellTextOrDefault(ri:number, ci:number) {
    const cell = this.getCell(ri, ci);
    return (cell && cell.text) ? cell.text : '';
  }

  getCellStyle(ri:number, ci:number) {
    const cell = this.getCell(ri, ci);
    if (cell && cell.style !== undefined) {
      return this.styles[cell.style];
    }
    return null;
  }

  getCellStyleOrDefault(ri:number, ci:number) {
    const { styles, rows } = this;
    const cell = rows.getCell(ri, ci);
    const cellStyle = (cell && cell.style !== undefined) ? styles[cell.style] : {};
    return helper.merge(this.defaultStyle(), cellStyle) as DefaultSettings['style'];
  }

  getSelectedCellStyle() {
    const { ri, ci } = this.selector;
    return this.getCellStyleOrDefault(ri, ci);
  }

  // state: input | finished
  setCellText(ri:number, ci:number, text:string, state:string) {
    const { rows, history, validations } = this;
    if (state === 'finished') {
      rows.setCellText(ri, ci, '');
      history.add(this.getData());
      rows.setCellText(ri, ci, text);
    } else {
      rows.setCellText(ri, ci, text);
      this.change(this.getData());
    }
    // validator
    validations.validate(ri, ci, text);
  }

  freezeIsActive() {
    const [ri, ci] = this.freeze;
    return ri > 0 || ci > 0;
  }

  setFreeze(ri:number, ci:number) {
    this.changeData(() => {
      this.freeze = [ri, ci];
    });
  }

  freezeTotalWidth() {
    return this.cols.sumWidth(0, this.freeze[1]);
  }

  freezeTotalHeight() {
    return this.rows.sumHeight(0, this.freeze[0]);
  }

  setRowHeight(ri:number, height:number) {
    this.changeData(() => {
      this.rows.setHeight(ri, height);
    });
  }

  setColWidth(ci:number, width:number) {
    this.changeData(() => {
      this.cols.setWidth(ci, width);
    });
  }

  viewHeight() {
    const { view, showToolbar, showBottomBar } = this.settings;
    let h = view.height();
    if (showBottomBar) {
      h -= bottombarHeight;
    }
    if (showToolbar) {
      h -= toolbarHeight;
    }
    return h;
  }

  viewWidth() {
    return this.settings.view.width();
  }

  freezeViewRange() {
    const [ri, ci] = this.freeze;
    return new CellRange(0, 0, ri - 1, ci - 1, this.freezeTotalWidth(), this.freezeTotalHeight());
  }

  contentRange() {
    const { rows, cols } = this;
    const [ri, ci] = rows.maxCell();
    const h = rows.sumHeight(0, ri + 1);
    const w = cols.sumWidth(0, ci + 1);
    return new CellRange(0, 0, ri, ci, w, h);
  }

  exceptRowTotalHeight(sri:number, eri:number) {
    const { exceptRowSet, rows } = this;
    const exceptRows = Array.from(exceptRowSet);
    let exceptRowTH = 0;
    exceptRows.forEach((ri) => {
      if (ri < sri || ri > eri) {
        const height = rows.getHeight(ri);
        exceptRowTH += height;
      }
    });
    return exceptRowTH;
  }

  viewRange() {
    const {
      scroll, rows, cols, freeze, exceptRowSet,
    } = this;
    // console.log('scroll:', scroll, ', freeze:', freeze)
    let { ri, ci } = scroll;
    if (ri <= 0) [ri] = freeze;
    if (ci <= 0) [, ci] = freeze;

    let [x, y] = [0, 0];
    let [eri, eci] = [rows.len, cols.len];
    for (let i = ri; i < rows.len; i += 1) {
      if (!exceptRowSet.has(i)) {
        y += rows.getHeight(i);
        eri = i;
      }
      if (y > this.viewHeight()) break;
    }
    for (let j = ci; j < cols.len; j += 1) {
      x += cols.getWidth(j);
      eci = j;
      if (x > this.viewWidth()) break;
    }
    // console.log(ri, ci, eri, eci, x, y);
    return new CellRange(ri, ci, eri, eci, x, y);
  }

  eachMergesInView(viewRange:CellRangePoints, cb:Function) {
    this.merges.filterIntersects(viewRange)
      .forEach(it => cb(it));
  }

  hideRowsOrCols() {
    const { rows, cols, selector } = this;
    const [rlen, clen] = selector.size();
    const {
      sri, sci, eri, eci,
    } = selector.range;
    if (rlen === rows.len) {
      for (let ci = sci; ci <= eci; ci += 1) {
        cols.setHide(ci, true);
      }
    } else if (clen === cols.len) {
      for (let ri = sri; ri <= eri; ri += 1) {
        rows.setHide(ri, true);
      }
    }
  }

  // type: row | col
  // index row-index | col-index
  unhideRowsOrCols(type:'row' | 'col', index:number) {
    this[`${type}s`].unhide(index);
  }

  rowEach(min:number, max:number, cb:Function) {
    let y = 0;
    const { rows } = this;
    const frset = this.exceptRowSet;
    const frary = [...frset];
    let offset = 0;
    for (let i = 0; i < frary.length; i += 1) {
      if (frary[i] < min) {
        offset += 1;
      }
    }
    // console.log('min:', min, ', max:', max, ', scroll:', scroll);
    for (let i = min + offset; i <= max + offset; i += 1) {
      if (frset.has(i)) {
        offset += 1;
      } else {
        const rowHeight = rows.getHeight(i);
        if (rowHeight > 0) {
          cb(i, y, rowHeight);
          y += rowHeight;
          if (y > this.viewHeight()) break;
        }
      }
    }
  }

  colEach(min:number, max:number, cb:Function) {
    let x = 0;
    const { cols } = this;
    for (let i = min; i <= max; i += 1) {
      const colWidth = cols.getWidth(i);
      if (colWidth > 0) {
        cb(i, x, colWidth);
        x += colWidth;
        if (x > this.viewWidth()) break;
      }
    }
  }

  defaultStyle() {
    return this.settings.style;
  }

  addStyle(nstyle:DefaultSettings['style']) {
    const { styles } = this;
    // console.log('old.styles:', styles, nstyle);
    for (let i = 0; i < styles.length; i += 1) {
      const style = styles[i];
      if (helper.equals(style, nstyle)) return i;
    }
    styles.push(nstyle);
    return styles.length - 1;
  }

  changeData(cb:Function) {
    this.history.add(this.getData());
    cb();
    this.change(this.getData());
  }

  setData(d: SheetData) {
    (Object.keys(d) as (keyof SheetData)[]).forEach((property) => {
      if (property === 'merges' || property === 'rows'
        || property === 'cols' || property === 'validations') {
          const dProp = d[property];
        if(dProp){
          this[property].setData(dProp);
        }
      } else if (property === 'freeze') {
        const f = d.freeze;
        if(f){
          const [x, y] = expr2xy(f);
          this.freeze = [y, x];
        }
      } else if (property === 'autofilter') {
        this.autoFilter.setData(d.autofilter);
      } else if (d[property] !== undefined) {
        this[property] = d[property];
      }
    });
    return this;
  }

  getData(): SheetData {
    const {
      name, freeze, styles, merges, rows, cols, validations, autoFilter,
    } = this;
    return {
      name,
      freeze: xy2expr(freeze[1], freeze[0]),
      styles,
      merges: merges.getData(),
      rows: rows.getData(),
      cols: cols.getData(),
      validations: validations.getData(),
      autofilter: autoFilter.getData(),
    };
  }
}
