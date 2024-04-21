import { type Element, h } from "./element";
import { cssPrefix } from "../config";
import { CellRange } from "../core/cell_range";
import type DataProxy from "../core/data_proxy";

export interface Offset {
  left?: number;
  top?: number;
  bottom?: number;
  width?: number;
  height?: number;
  scroll?: { x: number; y: number; ri: number; ci: number };
  l?: number;
  t?: number;
}

const selectorHeightBorderWidth = 2 * 2 - 1;
let startZIndex = 10;

class SelectorElement {
  useHideInput: unknown;
  autoFocus: unknown;
  inputChange: (arg: string) => void;
  cornerEl: Element<HTMLDivElement>;
  areaEl: Element<HTMLDivElement>;
  clipboardEl: Element<HTMLDivElement>;
  autofillEl: Element<HTMLDivElement>;
  el: Element<HTMLDivElement>;
  hideInput?: Element<HTMLInputElement>;
  hideInputDiv?: Element<HTMLDivElement>;

  constructor(useHideInput = false, autoFocus = true) {
    this.useHideInput = useHideInput;
    this.autoFocus = autoFocus;
    this.inputChange = () => {};
    this.cornerEl = h("div", `${cssPrefix}-selector-corner`);
    this.areaEl = h("div", `${cssPrefix}-selector-area`)
      .child(this.cornerEl)
      .hide();
    this.clipboardEl = h("div", `${cssPrefix}-selector-clipboard`).hide();
    this.autofillEl = h("div", `${cssPrefix}-selector-autofill`).hide();
    this.el = h("div", `${cssPrefix}-selector`)
      .css("z-index", String(startZIndex))
      .children(this.areaEl, this.clipboardEl, this.autofillEl)
      .hide();
    if (useHideInput) {
      this.hideInput = h<HTMLInputElement>("input", "").on(
        "compositionend",
        (evt) => {
          if (!evt.target || !("value" in evt.target)) {
            throw new Error("Expected value in target");
          }
          this.inputChange(evt.target.value);
        }
      );
      this.el.child(
        (this.hideInputDiv = h("div", "hide-input").child(this.hideInput))
      );
      this.el.child(
        (this.hideInputDiv = h("div", "hide-input").child(this.hideInput))
      );
    }
    startZIndex += 1;
  }

  setOffset(v: Offset) {
    this.el.offset(v).show();
    return this;
  }

  hide() {
    this.el.hide();
    return this;
  }

  setAreaOffset(v: Offset) {
    const { left, top, width, height } = v;

    if (
      width === undefined ||
      height === undefined ||
      left === undefined ||
      top === undefined
    ) {
      throw new Error("Expected area offset");
    }

    const of = {
      width: width - selectorHeightBorderWidth + 0.8,
      height: height - selectorHeightBorderWidth + 0.8,
      left: left - 0.8,
      top: top - 0.8,
    };
    this.areaEl.offset(of).show();
    if (this.useHideInput) {
      if (this.hideInputDiv === undefined || this.hideInput === undefined) {
        throw new Error("Expected hideInputDiv and hideInput");
      }

      this.hideInputDiv.offset(of);
      if (this.autoFocus) {
        this.hideInput.val("").focus();
      } else {
        this.hideInput.val("");
      }
    }
  }

  setClipboardOffset(v: Offset) {
    const { left, top, width, height } = v;
    this.clipboardEl.offset({
      left,
      top,
      width: width ? width - 5 : undefined,
      height: height ? height - 5 : undefined,
    });
  }

  showAutofill(v: Offset) {
    const { left, top, width, height } = v;
    if (width === undefined || height === undefined) {
      throw new Error("Expected width and height");
    }

    this.autofillEl
      .offset({
        width: width - selectorHeightBorderWidth,
        height: height - selectorHeightBorderWidth,
        left,
        top,
      })
      .show();
  }

  hideAutofill() {
    this.autofillEl.hide();
  }

  showClipboard() {
    this.clipboardEl.show();
  }

  hideClipboard() {
    this.clipboardEl.hide();
  }
}

export default class Selector {
  inputChange: (arg: string) => void;
  data: DataProxy;
  br: SelectorElement;
  t: SelectorElement;
  l: SelectorElement;
  tl: SelectorElement;
  offset: Offset | null;
  areaOffset: Offset | null;
  indexes: [number, number] | null;
  range: CellRange | null;
  arange: CellRange | null;
  el: Element<HTMLDivElement>;
  lastri: number;
  lastci: number;
  moveIndexes?: [number, number];

  constructor(data: DataProxy) {
    const { autoFocus } = data.settings;
    this.inputChange = () => {};
    this.data = data;
    this.br = new SelectorElement(true, autoFocus);
    this.t = new SelectorElement();
    this.l = new SelectorElement();
    this.tl = new SelectorElement();
    this.br.inputChange = (v: string) => {
      this.inputChange(v);
    };
    this.br.el.show();
    this.offset = null;
    this.areaOffset = null;
    this.indexes = null;
    this.range = null;
    this.arange = null;
    this.el = h("div", `${cssPrefix}-selectors`)
      .children(this.tl.el, this.t.el, this.l.el, this.br.el)
      .hide();

    // for performance
    this.lastri = -1;
    this.lastci = -1;

    startZIndex += 1;
  }

  private setAllAreaOffset(offset: Offset) {
    this.setBRAreaOffset(offset);
    this.setTLAreaOffset(offset);
    this.setTAreaOffset(offset);
    this.setLAreaOffset(offset);
  }

  private setBRAreaOffset(offset: Offset) {
    const { br } = this;
    br.setAreaOffset(this.calBRAreaOffset(offset));
  }

  private setTLAreaOffset(offset: Offset) {
    const { tl } = this;
    tl.setAreaOffset(offset);
  }

  private setTAreaOffset(offset: Offset) {
    const { t } = this;
    t.setAreaOffset(this.calTAreaOffset(offset));
  }

  private setLAreaOffset(offset: Offset) {
    const { l } = this;
    l.setAreaOffset(this.calLAreaOffset(offset));
  }

  private setLClipboardOffset(offset: Offset) {
    const { l } = this;
    l.setClipboardOffset(this.calLAreaOffset(offset));
  }

  private setBRClipboardOffset(offset: Offset) {
    const { br } = this;
    br.setClipboardOffset(this.calBRAreaOffset(offset));
  }

  private setTLClipboardOffset(offset: Offset) {
    const { tl } = this;
    tl.setClipboardOffset(offset);
  }

  private setTClipboardOffset(offset: Offset) {
    const { t } = this;
    t.setClipboardOffset(this.calTAreaOffset(offset));
  }

  private setAllClipboardOffset(offset: Offset) {
    this.setBRClipboardOffset(offset);
    this.setTLClipboardOffset(offset);
    this.setTClipboardOffset(offset);
    this.setLClipboardOffset(offset);
  }

  private calLAreaOffset(offset: Offset) {
    const { data } = this;
    const {
      top = 0,
      width,
      height,
      l,
      t = 0,
      scroll = { x: 0, y: 0, ri: 0, ci: 0 },
    } = offset;
    const ftheight = data.freezeTotalHeight();
    let top0 = top - ftheight;
    // console.log('ftheight:', ftheight, ', t:', t);
    if (ftheight > t) top0 -= scroll.y;
    return {
      left: l,
      top: top0,
      width,
      height,
    };
  }

  private calBRAreaOffset(offset: Offset) {
    const { data } = this;
    const {
      left,
      top,
      width,
      height,
      scroll = { x: 0, y: 0, ri: 0, ci: 0 },
      l,
      t,
    } = offset;

    if (left === undefined || top === undefined) {
      throw new Error("Expected left, top");
    }

    const ftwidth = data.freezeTotalWidth();
    const ftheight = data.freezeTotalHeight();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    let top0 = top - ftheight;
    if (ftheight > t) top0 -= scroll.y;
    return {
      left: left0,
      top: top0,
      width,
      height,
    };
  }

  private calTAreaOffset(offset: Offset) {
    const { data } = this;
    const {
      left,
      width,
      height,
      l,
      t,
      scroll = { x: 0, y: 0, ri: 0, ci: 0 },
    } = offset;

    if (left === undefined) {
      throw new Error("Expected left");
    }
    const ftwidth = data.freezeTotalWidth();
    let left0 = left - ftwidth;
    if (ftwidth > l) left0 -= scroll.x;
    return {
      left: left0,
      top: t,
      width,
      height,
    };
  }

  resetData(data: DataProxy) {
    this.data = data;
    this.range = data.selector.range;
    this.resetAreaOffset();
  }

  hide() {
    this.el.hide();
  }

  resetOffset() {
    const { data, tl, t, l, br } = this;
    const freezeHeight = data.freezeTotalHeight();
    const freezeWidth = data.freezeTotalWidth();
    if (freezeHeight > 0 || freezeWidth > 0) {
      tl.setOffset({ width: freezeWidth, height: freezeHeight });
      t.setOffset({ left: freezeWidth, height: freezeHeight });
      l.setOffset({ top: freezeHeight, width: freezeWidth });
      br.setOffset({ left: freezeWidth, top: freezeHeight });
    } else {
      tl.hide();
      t.hide();
      l.hide();
      br.setOffset({ left: 0, top: 0 });
    }
  }

  resetAreaOffset() {
    // console.log('offset:', offset);
    const offset = this.data.getSelectedRect();
    const coffset = this.data.getClipboardRect();
    this.setAllAreaOffset(offset);
    this.setAllClipboardOffset(coffset);
    this.resetOffset();
  }

  resetBRTAreaOffset() {
    const offset = this.data.getSelectedRect();
    const coffset = this.data.getClipboardRect();
    this.setBRAreaOffset(offset);
    this.setTAreaOffset(offset);
    this.setBRClipboardOffset(coffset);
    this.setTClipboardOffset(coffset);
    this.resetOffset();
  }

  resetBRLAreaOffset() {
    const offset = this.data.getSelectedRect();
    const coffset = this.data.getClipboardRect();
    this.setBRAreaOffset(offset);
    this.setLAreaOffset(offset);
    this.setBRClipboardOffset(coffset);
    this.setLClipboardOffset(coffset);
    this.resetOffset();
  }

  set(ri: number, ci: number, indexesUpdated = true) {
    const { data } = this;
    const cellRange = data.calSelectedRangeByStart(ri, ci);
    const { sri, sci } = cellRange;
    if (indexesUpdated) {
      let [cri, cci] = [ri, ci];
      if (ri < 0) cri = 0;
      if (ci < 0) cci = 0;
      data.selector.setIndexes(cri, cci);
      this.indexes = [cri, cci];
    }

    this.moveIndexes = [sri, sci];
    // this.sIndexes = sIndexes;
    // this.eIndexes = eIndexes;
    this.range = cellRange;
    this.resetAreaOffset();
    this.el.show();
  }

  setEnd(ri: number, ci: number, moving = true) {
    const { data, lastri, lastci } = this;
    if (moving) {
      if (ri === lastri && ci === lastci) return;
      this.lastri = ri;
      this.lastci = ci;
    }
    this.range = data.calSelectedRangeByEnd(ri, ci);
    this.setAllAreaOffset(this.data.getSelectedRect());
  }

  reset() {
    // console.log('::::', this.data);
    const { eri, eci } = this.data.selector.range;
    this.setEnd(eri, eci);
  }

  showAutofill(ri: number, ci: number) {
    if (ri === -1 && ci === -1) return;
    // console.log('ri:', ri, ', ci:', ci);
    // const [sri, sci] = this.sIndexes;
    // const [eri, eci] = this.eIndexes;
    if (this.range === null) {
      throw new Error("Expected initialized range");
    }

    const { sri, sci, eri, eci } = this.range;
    const [nri, nci] = [ri, ci];
    // const rn = eri - sri;
    // const cn = eci - sci;
    const srn = sri - ri;
    const scn = sci - ci;
    const ern = eri - ri;
    const ecn = eci - ci;
    if (scn > 0) {
      // left
      // console.log('left');
      this.arange = new CellRange(sri, nci, eri, sci - 1);
      // this.saIndexes = [sri, nci];
      // this.eaIndexes = [eri, sci - 1];
      // data.calRangeIndexes2(
    } else if (srn > 0) {
      // top
      // console.log('top');
      // nri = sri;
      this.arange = new CellRange(nri, sci, sri - 1, eci);
      // this.saIndexes = [nri, sci];
      // this.eaIndexes = [sri - 1, eci];
    } else if (ecn < 0) {
      // right
      // console.log('right');
      // nci = eci;
      this.arange = new CellRange(sri, eci + 1, eri, nci);
      // this.saIndexes = [sri, eci + 1];
      // this.eaIndexes = [eri, nci];
    } else if (ern < 0) {
      // bottom
      // console.log('bottom');
      // nri = eri;
      this.arange = new CellRange(eri + 1, sci, nri, eci);
      // this.saIndexes = [eri + 1, sci];
      // this.eaIndexes = [nri, eci];
    } else {
      // console.log('else:');
      this.arange = null;
      // this.saIndexes = null;
      // this.eaIndexes = null;
      return;
    }
    if (this.arange !== null) {
      // console.log(this.saIndexes, ':', this.eaIndexes);
      const offset = this.data.getRect(this.arange);
      if (offset.width === undefined || offset.height === undefined) {
        throw new Error("Expected offset");
      }

      offset.width += 2;
      offset.height += 2;
      const { br, l, t, tl } = this;
      br.showAutofill(this.calBRAreaOffset(offset));
      l.showAutofill(this.calLAreaOffset(offset));
      t.showAutofill(this.calTAreaOffset(offset));
      tl.showAutofill(offset);
    }
  }

  hideAutofill() {
    ["br", "l", "t", "tl"].forEach((property) => {
      this[property].hideAutofill();
    });
  }

  showClipboard() {
    const coffset = this.data.getClipboardRect();
    this.setAllClipboardOffset(coffset);

    this.br.showClipboard();
    this.l.showClipboard();
    this.t.showClipboard();
    this.tl.showClipboard();
  }

  hideClipboard() {
    this.br.hideClipboard();
    this.l.hideClipboard();
    this.t.hideClipboard();
    this.tl.hideClipboard();
  }
}
