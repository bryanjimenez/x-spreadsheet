//* global window */
import { h } from './element';
import Suggest from './suggest';
import Datepicker from './datepicker';
import { cssPrefix } from '../config';
import { type Formula } from '../core/formula';
import { Element } from './element';
import { type CellData } from '..';
import type Validator from '../core/validator';


function dateFormat(d:Date) {
  let month = d.getMonth() + 1;
  let date = d.getDate();
  let strMonth = String(month);
  let strDate = String(date);
  if (month < 10) strMonth = `0${month}`;
  if (date < 10) strDate = `0${date}`;
  return `${d.getFullYear()}-${strMonth}-${strDate}`;
}

export default class Editor {
  viewFn: Function;
  rowHeight: number;
  formulas: Formula[];
  suggest: Suggest;
  datepicker: Datepicker;
  el: Element<HTMLDivElement>;
  areaEl: Element<HTMLDivElement>;
  textEl: Element<HTMLTextAreaElement>;
  textlineEl: Element<HTMLDivElement>;

  areaOffset: {left:number, top:number, width:number, height:number, l:number, t:number} | null;
  freeze: { w: number, h: number };
  cell: CellData | null;
  inputText: string;
  change: (state:string, itext:string) => void;
  validator?: Validator;

  constructor(formulas:Formula[], viewFn:Function, rowHeight:number) {
    this.viewFn = viewFn;
    this.rowHeight = rowHeight;
    this.formulas = formulas;
    this.suggest = new Suggest(formulas, (it) => {
      this.suggestItemClick(it);
    });
    this.datepicker = new Datepicker();
    this.datepicker.change((d) => {
      // console.log('d:', d);
      this.setText(dateFormat(d));
      this.clear();
    });
    this.areaEl = h('div', `${cssPrefix}-editor-area`)
      .children(
        this.textEl = h<HTMLTextAreaElement>('textarea', '')
          .on('input', evt => this.inputEventHandler(evt))
          .on('paste.stop', () => {})
          .on('keydown', evt => this.keydownEventHandler(evt)),
        this.textlineEl = h('div', 'textline'),
        this.suggest.el,
        this.datepicker.el,
      )
      .on('mousemove.stop', () => {})
      .on('mousedown.stop', () => {});
    this.el = h('div', `${cssPrefix}-editor`)
      .child(this.areaEl).hide();
    this.suggest.bindInputEvents(this.textEl);

    this.areaOffset = null;
    this.freeze = { w: 0, h: 0 };
    this.cell = null;
    this.inputText = '';
    this.change = () => {};
  }


  private resetTextareaSize() {
    const { inputText } = this;
    if (!/^\s*$/.test(inputText)) {
      const {
        textlineEl, textEl, areaOffset,
      } = this;

      if(areaOffset===null){
        throw new Error("areaOffset is null");
      }

      const txts = inputText.split('\n');
      const maxTxtSize = Math.max(...txts.map(it => it.length));
      const tlOffset = textlineEl.offset();
      const fontWidth = tlOffset.width / inputText.length;
      const tlineWidth = (maxTxtSize + 1) * fontWidth + 5;
      const maxWidth = this.viewFn().width - areaOffset.left - fontWidth;
      let h1 = txts.length;
      if (tlineWidth > areaOffset.width) {
        let twidth = tlineWidth;
        if (tlineWidth > maxWidth) {
          twidth = maxWidth;
          h1 += Math.trunc(tlineWidth / maxWidth);
          h1 += (tlineWidth % maxWidth) > 0 ? 1 : 0;
        }
        textEl.css('width', `${twidth}px`);
      }
      h1 *= this.rowHeight;
      if (h1 > areaOffset.height) {
        textEl.css('height', `${h1}px`);
      }
    }
  }

  private insertText(target: HTMLTextAreaElement, itxt:string) {
    const { value, selectionEnd } = target;
    if(selectionEnd===null){
      throw new Error("Expected selectionEnd to not be null");
    }

    const ntxt = `${value.slice(0, selectionEnd)}${itxt}${value.slice(selectionEnd)}`;
    target.value = ntxt;
    target.setSelectionRange(selectionEnd + 1, selectionEnd + 1);

    this.inputText = ntxt;
    this.textlineEl.html(ntxt);
    this.resetTextareaSize();
  }

  private keydownEventHandler(evt:Event) {
    if(!(evt instanceof KeyboardEvent && evt.target instanceof HTMLTextAreaElement)){
      throw new Error("Expected KeyboardEvent")
    }

    const { keyCode, altKey } = evt;
    if (keyCode !== 13 && keyCode !== 9) evt.stopPropagation();
    if (keyCode === 13 && altKey) {
      this.insertText(evt.target, '\n');
      evt.stopPropagation();
    }
    if (keyCode === 13 && !altKey) evt.preventDefault();
  }

  private inputEventHandler({target}: Event) {
    if(!(target instanceof HTMLTextAreaElement)){
      throw new Error("Expected HTMLInputElement")
    }
    const v = target.value;
    // console.log(evt, 'v:', v);
    const { suggest, textlineEl, validator } = this;
    const { cell } = this;
    if (cell !== null) {
      if ((cell.editable === true) || (cell.editable === undefined)) {
        this.inputText = v;
        if (validator) {
          if (validator.type === 'list') {
            suggest.search(v);
          } else {
            suggest.hide();
          }
        } else {
          const start = v.lastIndexOf('=');
          if (start !== -1) {
            suggest.search(v.substring(start + 1));
          } else {
            suggest.hide();
          }
        }
        textlineEl.html(v);
        this.resetTextareaSize();
        this.change('input', v);
      } else {
        target.value = cell.text || '';
      }
    } else {
      this.inputText = v;
      if (validator) {
        if (validator.type === 'list') {
          suggest.search(v);
        } else {
          suggest.hide();
        }
      } else {
        const start = v.lastIndexOf('=');
        if (start !== -1) {
          suggest.search(v.substring(start + 1));
        } else {
          suggest.hide();
        }
      }
      textlineEl.html(v);
      this.resetTextareaSize();
      this.change('input', v);
    }
  }

  setText(text:string) {
    this.inputText = text;
    // console.log('text>>:', text);
    // this.setText2(text, text.length);
    const { textEl, textlineEl } = this;
    // firefox bug
    textEl.el.blur();
  
    textEl.val(text);
    textlineEl.html(text);
    this.setTextareaRange(text.length);
    this.resetTextareaSize();
  }

  private setTextareaRange(position:number) {
    const { el } = this.textEl;
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(position, position);
    }, 0);
  }

  private suggestItemClick(it:Formula) {
    const { inputText, validator } = this;
    let position = 0;
    if (validator && validator.type === 'list') {
      if(typeof it !== 'string'){
        throw new Error("Expected it to contain list data validation")
      }
      this.inputText = it;
      position = this.inputText.length;
    } else {
      if(typeof it === 'string'){
        throw new Error("Expected it to contain function info")
      }
      const start = inputText.lastIndexOf('=');
      const sit = inputText.substring(0, start + 1);
      let eit = inputText.substring(start + 1);
      if (eit.indexOf(')') !== -1) {
        eit = eit.substring(eit.indexOf(')'));
      } else {
        eit = '';
      }
      this.inputText = `${sit + it.key}(`;
      // console.log('inputText:', this.inputText);
      position = this.inputText.length;
      this.inputText += `)${eit}`;
    }
    // this.setText(this.inputText, position);
    this.setText(this.inputText);
  }

  private resetSuggestItems() {
    this.suggest.setItems(this.formulas);
  }

  setFreezeLengths(width:number, height:number) {
    this.freeze.w = width;
    this.freeze.h = height;
  }

  clear() {
    // const { cell } = this;
    // const cellText = (cell && cell.text) || '';
    if (this.inputText !== '') {
      this.change('finished', this.inputText);
    }
    this.cell = null;
    this.areaOffset = null;
    this.inputText = '';
    this.el.hide();
    this.textEl.val('');
    this.textlineEl.html('');
    this.resetSuggestItems();
    this.datepicker.hide();
  }

  setOffset<O extends {left:number, top:number, width:number, height:number, l:number, t:number}>(offset:O, suggestPosition = 'top') {
    const {
      textEl, areaEl, suggest, freeze, el,
    } = this;
    if (offset) {
      this.areaOffset = offset;
      const {
        left, top, width, height, l, t,
      } = offset;
      // console.log('left:', left, ',top:', top, ', freeze:', freeze);
      const elOffset = { left: 0, top: 0 };
      // top left
      if (freeze.w > l && freeze.h > t) {
        //
      } else if (freeze.w < l && freeze.h < t) {
        elOffset.left = freeze.w;
        elOffset.top = freeze.h;
      } else if (freeze.w > l) {
        elOffset.top = freeze.h;
      } else if (freeze.h > t) {
        elOffset.left = freeze.w;
      }
      el.offset(elOffset);
      areaEl.offset({ left: left - elOffset.left - 0.8, top: top - elOffset.top - 0.8 });
      textEl.offset({ width: width - 9 + 0.8, height: height - 3 + 0.8 });
      const sOffset = { left: 0 };
      sOffset[suggestPosition] = height;
      suggest.setOffset(sOffset);
      suggest.hide();
    }
  }

  setCell(cell:CellData, validator:Validator) {
    if (cell && cell.editable === false) return;

    // console.log('::', validator);
    const { el, datepicker, suggest } = this;
    el.show();
    this.cell = cell;
    const text = (cell && cell.text) || '';
    this.setText(text);

    this.validator = validator;
    if (validator) {
      const { type } = validator;
      if (type === 'date') {
        datepicker.show();
        if (!/^\s*$/.test(text)) {
          datepicker.setValue(text);
        }
      }
      if (type === 'list') {
        suggest.setItems(validator.values());
        suggest.search('');
      }
    }
  }

}
