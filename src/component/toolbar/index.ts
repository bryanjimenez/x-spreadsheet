/* global window */

import Align from './align';
import Valign from './valign';
import Autofilter from './autofilter';
import Bold from './bold';
import Italic from './italic';
import Strike from './strike';
import Underline from './underline';
import Border from './border';
import Clearformat from './clearformat';
import Paintformat from './paintformat';
import TextColor from './text_color';
import FillColor from './fill_color';
import FontSize from './font_size';
import Font from './font';
import Format from './format';
import Formula from './formula';
import Freeze from './freeze';
import Merge from './merge';
import Redo from './redo';
import Undo from './undo';
import Print from './print';
import Textwrap from './textwrap';
import More from './more';
import Item from './item';

import { type Element, h } from '../element';
import { cssPrefix } from '../../config';
import { bind } from '../event';
import type DataProxy from '../../core/data_proxy';

export interface ExtendToolbarOption {
  tip?: string;
  el?: Element<HTMLElement>;
  icon?: string;
  onClick?: (data: object, sheet: object) => void;
}

export type ToolBarChangeType =
  | "undo"
  | "redo"
  | "print"
  | "paintformat"
  | "clearformat"
  | "link"
  | "chart"
  | "autofilter"
  | "freeze"
  | "formula"

  | 'format'
  | 'font-name'
  | 'formula'
  | 'font-size'
  | 'color'
  | 'bgcolor'
  | 'align'
  | 'valign'
  | 'border'
  
  | 'printable'
  | 'editable'
  | 'merge'
  
  | 'font-bold'
  | 'font-italic'
  | 'font-name'
  | 'font-size'
  | 'strike'
  | 'textwrap'
  | 'underline';


function buildDivider() {
  return h('div', `${cssPrefix}-toolbar-divider`);
}

export default class Toolbar {
  el: Element<HTMLDivElement>;
  btns: Element<HTMLDivElement>;
  btns2: [Element<HTMLDivElement>,number][];
  data: DataProxy;
  change: Function;
  widthFn: Function;
  isHide:boolean;

  items: (unknown|unknown[])[];
  moreEl: More

  undoEl:Undo;
  redoEl:Redo;

  paintformatEl: Paintformat;
  clearformatEl: Clearformat;
  formatEl: Format;
  fontEl: Font;
  fontSizeEl: FontSize;
  boldEl: Bold;
  italicEl: Italic;
  underlineEl: Underline;
  strikeEl: Strike;
  textColorEl: TextColor;

  fillColorEl: FillColor
  borderEl: Border
  mergeEl: Merge
  alignEl: Align
  valignEl: Valign
  textwrapEl: Textwrap
  freezeEl: Freeze
  autofilterEl: Autofilter
  formulaEl: Formula



  constructor(data:DataProxy, widthFn:Function, isHide = false) {
    this.data = data;
    this.change = () => {};
    this.widthFn = widthFn;
    this.isHide = isHide;
    const style = data.defaultStyle();
    this.items = [
      [
        this.undoEl = new Undo(),
        this.redoEl = new Redo(),
        new Print(),
        this.paintformatEl = new Paintformat(),
        this.clearformatEl = new Clearformat(),
      ],
      buildDivider(),
      [
        this.formatEl = new Format(),
      ],
      buildDivider(),
      [
        this.fontEl = new Font(),
        this.fontSizeEl = new FontSize(),
      ],
      buildDivider(),
      [
        this.boldEl = new Bold(),
        this.italicEl = new Italic(),
        this.underlineEl = new Underline(),
        this.strikeEl = new Strike(),
        this.textColorEl = new TextColor(style.color),
      ],
      buildDivider(),
      [
        this.fillColorEl = new FillColor(style.bgcolor),
        this.borderEl = new Border(),
        this.mergeEl = new Merge(),
      ],
      buildDivider(),
      [
        this.alignEl = new Align(style.align),
        this.valignEl = new Valign(style.valign),
        this.textwrapEl = new Textwrap(),
      ],
      buildDivider(),
      [
        this.freezeEl = new Freeze(),
        this.autofilterEl = new Autofilter(),
        this.formulaEl = new Formula(),
      ],
    ];

    const { extendToolbar = {} } = data.settings;

    if (extendToolbar.left && extendToolbar.left.length > 0) {
      this.items.unshift(buildDivider());
      const btns = extendToolbar.left.map(this.genBtn.bind(this));

      this.items.unshift(btns);
    }
    if (extendToolbar.right && extendToolbar.right.length > 0) {
      this.items.push(buildDivider());
      const btns = extendToolbar.right.map(this.genBtn.bind(this));
      this.items.push(btns);
    }

    this.items.push([this.moreEl = new More()]);

    this.el = h('div', `${cssPrefix}-toolbar`);
    this.btns = h('div', `${cssPrefix}-toolbar-btns`);

    this.items.forEach((it) => {
      if (Array.isArray(it)) {
        it.forEach((i) => {
          this.btns.child(i.el);
          i.change = (...args) => {
            this.change(...args);
          };
        });
      } else {
        this.btns.child(it.el);
      }
    });

    this.el.child(this.btns);
    this.btns2 = [];
    if (isHide) {
      this.el.hide();
    } else {
      this.reset();
      // TODO: this.reset promise? to avoid
      setTimeout(() => {
        this.initBtns2();
        this.moreResize();
      }, 0);

      bind(window, 'resize', () => {
        this.moreResize();
      });
    }
  }

  private genBtn(it:ExtendToolbarOption) {
    const btn = new Item();
    btn.el.on('click', () => {
      if (it.onClick) it.onClick(this.data.getData(), this.data);
    });
    btn.tip = it.tip || '';

    let { el } = it;

    if (it.icon) {
      el = h('img').attr('src', it.icon);
    }

    if (el) {
      const icon = h('div', `${cssPrefix}-icon`);
      icon.child(el);
      btn.el.child(icon);
    }

    return btn;
  }

  private initBtns2() {
    const btns2:[Element<HTMLDivElement>, number][] = [];

    this.items.forEach((it) => {
      if (Array.isArray(it)) {
        it.forEach(({ el }) => {
          const rect = el.box();
          const { marginLeft, marginRight } = el.computedStyle();
          btns2.push([el, rect.width + parseInt(marginLeft, 10) + parseInt(marginRight, 10)]);
        });
      } else {
        const el = it as Element<HTMLDivElement>
        const rect = el.box();
        const { marginLeft, marginRight } = el.computedStyle();
        btns2.push([el, rect.width + parseInt(marginLeft, 10) + parseInt(marginRight, 10)]);
      }
    });

    this.btns2 = btns2;
  }

  private moreResize() {
    const {
      el, btns, moreEl, btns2,
    } = this;
    const { moreBtns, contentEl } = moreEl.dd;
    el.css('width', `${this.widthFn()}px`);
    const elBox = el.box();
  
    let sumWidth = 160;
    let sumWidth2 = 12;
    const list1:Element<HTMLDivElement>[] = [];
    const list2:Element<HTMLDivElement>[] = [];
    btns2.forEach(([it, w], index) => {
      sumWidth += w;
      if (index === btns2.length - 1 || sumWidth < elBox.width) {
        list1.push(it);
      } else {
        sumWidth2 += w;
        list2.push(it);
      }
    });
    btns.html('').children(...list1);
    moreBtns.html('').children(...list2);
    contentEl.css('width', `${sumWidth2}px`);
    if (list2.length > 0) {
      moreEl.show();
    } else {
      moreEl.hide();
    }
  }
  
  paintformatActive() {
    return this.paintformatEl.active();
  }

  paintformatToggle() {
    this.paintformatEl.toggle();
  }

  trigger(type) {
    this[`${type}El`].click();
  }

  resetData(data:DataProxy) {
    this.data = data;
    this.reset();
  }

  reset() {
    if (this.isHide) return;
    const { data } = this;
    const style = data.getSelectedCellStyle();
    // console.log('canUndo:', data.canUndo());
    this.undoEl.setState(!data.canUndo());
    this.redoEl.setState(!data.canRedo());
    this.mergeEl.setState(data.canUnmerge(), !data.selector.multiple());
    this.autofilterEl.setState(!data.canAutofilter());
    // this.mergeEl.disabled();
    // console.log('selectedCell:', style, cell);
    const { font, format } = style;
    this.formatEl.setState(format);
    this.fontEl.setState(font.name);
    this.fontSizeEl.setState(String(font.size));
    this.boldEl.setState(font.bold);
    this.italicEl.setState(font.italic);
    this.underlineEl.setState(style.underline);
    this.strikeEl.setState(style.strike);
    this.textColorEl.setState(style.color);
    this.fillColorEl.setState(style.bgcolor);
    this.alignEl.setState(style.align);
    this.valignEl.setState(style.valign);
    this.textwrapEl.setState(style.textwrap);
    // console.log('freeze is Active:', data.freezeIsActive());
    this.freezeEl.setState(data.freezeIsActive());
  }
}
