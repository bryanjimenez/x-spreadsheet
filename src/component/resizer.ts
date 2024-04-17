/* global window */
import { type Element, h } from './element';
import { mouseMoveUp } from './event';
import { cssPrefix } from '../config';
import { type Offset } from './selector';

export default class Resizer {
  moving: boolean;
  vertical: boolean;
  el: Element<HTMLDivElement>;
  unhideHoverEl: Element<HTMLDivElement>;
  hoverEl: Element<HTMLDivElement>;
  lineEl: Element<HTMLDivElement>;
  
  cRect: Offset | null;
  finishedFn: Function|null;
  minDistance: number;
  unhideFn: Function;
  unhideIndex?: number;

  constructor(vertical = false, minDistance:number) {
    this.moving = false;
    this.vertical = vertical;
    this.el = h('div', `${cssPrefix}-resizer ${vertical ? 'vertical' : 'horizontal'}`).children(
      this.unhideHoverEl = h('div', `${cssPrefix}-resizer-hover`)
        .on('dblclick.stop', evt => this.mousedblclickHandler(evt))
        .css('position', 'absolute').hide(),
      this.hoverEl = h('div', `${cssPrefix}-resizer-hover`)
        .on('mousedown.stop', evt => this.mousedownHandler(evt)),
      this.lineEl = h('div', `${cssPrefix}-resizer-line`).hide(),
    ).hide();
    // cell rect
    this.cRect = null;
    this.finishedFn = null;
    this.minDistance = minDistance;
    this.unhideFn = () => {};
  }

  showUnhide(index: number) {
    this.unhideIndex = index;
    this.unhideHoverEl.show();
  }

  hideUnhide() {
    this.unhideHoverEl.hide();
  }

  // rect : {top, left, width, height}
  // line : {width, height}
  show(rect:{top:number, left:number, width:number, height:number}, line:{width?:number, height?:number}) {
    const {
      moving, vertical, hoverEl, lineEl, el,
      unhideHoverEl,
    } = this;
    if (moving) return;
    this.cRect = rect;
    const {
      left, top, width, height,
    } = rect;
    el.offset({
      left: vertical ? left + width - 5 : left,
      top: vertical ? top : top + height - 5,
    }).show();
    hoverEl.offset({
      width: vertical ? 5 : width,
      height: vertical ? height : 5,
    });
    lineEl.offset({
      width: vertical ? 0 : line.width,
      height: vertical ? line.height : 0,
    });
    unhideHoverEl.offset({
      left: vertical ? 5 - width : left,
      top: vertical ? top : 5 - height,
      width: vertical ? 5 : width,
      height: vertical ? height : 5,
    });
  }

  hide() {
    this.el.offset({
      left: 0,
      top: 0,
    }).hide();
    this.hideUnhide();
  }

  mousedblclickHandler(_evt:Event) {
    if (this.unhideIndex) this.unhideFn(this.unhideIndex);
  }

  mousedownHandler(evt: Event) {
    let startEvt:Event|null = evt;
    const {
      el, lineEl, cRect, vertical, minDistance,
    } = this;
    if(cRect===null ) throw new Error("cRectangle is null");

    let distance = vertical ? cRect.width : cRect.height;

    // console.log('distance:', distance);
    lineEl.show();
    mouseMoveUp(window, (e:Event) => {
      if(distance===undefined ) throw new Error("cRectangle width height is undefined");
      if(!(e instanceof MouseEvent)){
        throw new Error("Expected MouseEvent")
      }

      this.moving = true;
      if (startEvt !== null && e.buttons === 1) {
        // console.log('top:', top, ', left:', top, ', cRect:', cRect);
        if (vertical) {
          distance += e.movementX;
          if (distance > minDistance && cRect.left !==undefined) {
            el.css('left', `${cRect.left + distance}px`);
          }
        } else {
          distance += e.movementY;
          if (distance > minDistance && cRect.top!==undefined) {
            el.css('top', `${cRect.top + distance}px`);
          }
        }
        startEvt = e;
      }
    }, () => {
      startEvt = null;
      lineEl.hide();
      this.moving = false;
      this.hide();
      if (this.finishedFn && distance!==undefined) {
        if (distance < minDistance) distance = minDistance;
        this.finishedFn(cRect, distance);
      }
    });
  }
}
