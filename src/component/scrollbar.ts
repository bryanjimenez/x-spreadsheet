import { type Element, h } from './element';
import { cssPrefix } from '../config';

export default class Scrollbar {
  el:Element<HTMLDivElement>;
  contentEl: Element<HTMLDivElement>;
  vertical: boolean;
  moveFn: Function | null;

  constructor(vertical: boolean) {
    this.vertical = vertical;
    this.moveFn = null;
    this.el = h('div', `${cssPrefix}-scrollbar ${vertical ? 'vertical' : 'horizontal'}`)
      .child(this.contentEl = h('div', ''))
      .on('mousemove.stop', () => {})
      .on('scroll.stop', (evt) => {
        const {target} = evt;
        if(!(target instanceof HTMLElement )){
          throw new Error("Expected HTMLElement")
        }
        const { scrollTop, scrollLeft } = target;
        // console.log('scrollTop:', scrollTop);
        if (this.moveFn) {
          this.moveFn(this.vertical ? scrollTop : scrollLeft, evt);
        }
        // console.log('evt:::', evt);
      });
  }

  move<T extends {left?:number, top?:number}>(v:T) {
    this.el.scroll(v);
    return this;
  }

  scroll() {
    return this.el.scroll();
  }

  set(distance:number, contentDistance:number) {
    const d = distance - 1;
    // console.log('distance:', distance, ', contentDistance:', contentDistance);
    if (contentDistance > d) {
      const cssKey = this.vertical ? 'height' : 'width';
      // console.log('d:', d);
      this.el.css(cssKey, `${d - 15}px`).show();
      this.contentEl
        .css(this.vertical ? 'width' : 'height', '1px')
        .css(cssKey, `${contentDistance}px`);
    } else {
      this.el.hide();
    }
    return this;
  }
}
