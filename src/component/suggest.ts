import { type Element, h } from './element';
import { bindClickoutside, unbindClickoutside } from './event';
import { cssPrefix } from '../config';
import { type Formula } from '../core/formula';


export default class Suggest {
  filterItems: Element<HTMLDivElement>[];
  items: Formula[];
  el: Element<HTMLDivElement>;
  itemClick: (arg: Formula)=>void;
  // itemClick: (...arg:unknown[])=>void;
  itemIndex: number;

  constructor(items: Formula[], itemClick:(arg: Formula)=>void, width = '200px') {
    this.filterItems = [];
    this.items = items;
    this.el = h('div', `${cssPrefix}-suggest`).css('width', width).hide();
    this.itemClick = itemClick;
    this.itemIndex = -1;
  }

  setOffset(v:Record<string,number>) {
    this.el.cssRemoveKeys('top', 'bottom')
      .offset(v);
  }

  hide() {
    const { el } = this;
    this.filterItems = [];
    this.itemIndex = -1;
    el.hide();
    unbindClickoutside(this.el.parent());
  }

  setItems(items:Formula[]) {
    this.items = items;
    // this.search('');
  }

  search(word:string) {
    let { items } = this;
    if (!/^\s*$/.test(word)) {
      items = items.filter(it => it.key.startsWith(word.toUpperCase()));
    }

    const filteredItems = items.map((it) => {
      const item = h('div', `${cssPrefix}-item`)
        .child(it.title())
        .on('click.stop', () => {
          this.itemClick(it);
          this.hide();
        });
      return item;
    });

    this.filterItems = filteredItems;
    if (filteredItems.length <= 0) {
      return;
    }

    const { el } = this;
    el.html('').children(...filteredItems).show();
    bindClickoutside(el.parent(), () => { this.hide(); });
  }

  bindInputEvents(input:Element<HTMLTextAreaElement>  ) {
    input.on('keydown', (evt:KeyboardEvent) => this.inputKeydownHandler(evt));
  }

  private inputKeydownHandler(evt:KeyboardEvent) {
    const { keyCode } = evt;
    if (evt.ctrlKey) {
      evt.stopPropagation();
    }
    switch (keyCode) {
      case 37: // left
        evt.stopPropagation();
        break;
      case 38: // up
        this.inputMovePrev(evt);
        break;
      case 39: // right
        evt.stopPropagation();
        break;
      case 40: // down
        this.inputMoveNext(evt);
        break;
      case 13: // enter
        this.inputEnter(evt);
        break;
      case 9:
        this.inputEnter(evt);
        break;
      default:
        evt.stopPropagation();
        break;
    }
  }

  private inputMovePrev(evt:Event) {
    evt.preventDefault();
    evt.stopPropagation();
    const { filterItems } = this;
    if (filterItems.length <= 0) return;
    if (this.itemIndex >= 0) filterItems[this.itemIndex].toggle();
    this.itemIndex -= 1;
    if (this.itemIndex < 0) {
      this.itemIndex = filterItems.length - 1;
    }
    filterItems[this.itemIndex].toggle();
  }
  
  private inputMoveNext(evt:Event) {
    evt.stopPropagation();
    const { filterItems } = this;
    if (filterItems.length <= 0) return;
    if (this.itemIndex >= 0) filterItems[this.itemIndex].toggle();
    this.itemIndex += 1;
    if (this.itemIndex > filterItems.length - 1) {
      this.itemIndex = 0;
    }
    filterItems[this.itemIndex].toggle();
  }
  
  private inputEnter(evt:KeyboardEvent) {
    evt.preventDefault();
    const { filterItems } = this;
    if (filterItems.length <= 0) return;
    evt.stopPropagation();
    if (this.itemIndex < 0) this.itemIndex = 0;
    filterItems[this.itemIndex].el.click();
    this.hide();
  }
}
