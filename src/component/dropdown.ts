import { Element, h } from './element';
import { bindClickoutside, unbindClickoutside } from './event';
import { cssPrefix } from '../config';
import type Icon from './icon';

export default class Dropdown extends Element<HTMLDivElement> {
  title: Element<HTMLDivElement> | Icon ;
  change: Function;
  headerClick: Function;
  headerEl: Element<HTMLDivElement>;
  contentEl: Element<HTMLDivElement>;

  constructor(title: Icon | string , width:string|"auto", showArrow:boolean, placement:string, ...children:Element<HTMLDivElement>[]) {
    super('div', `${cssPrefix}-dropdown ${placement}`);
    this.title = typeof title === 'string'? h('div', `${cssPrefix}-dropdown-title`).child(title): title;
    this.change = () => {};
    this.headerClick = () => {};
    if (typeof title !== 'string' && showArrow) {
      this.title.addClass('arrow-left');
    }
    this.contentEl = h('div', `${cssPrefix}-dropdown-content`)
      .css('width', width)
      .hide();

    this.setContentChildren(...children);

    this.headerEl = h('div', `${cssPrefix}-dropdown-header`);
    this.headerEl.on('click', () => {
      if (this.contentEl.css('display') !== 'block') {
        this.show();
      } else {
        this.hide();
      }
    }).children(
      this.title,
      showArrow ? h('div', `${cssPrefix}-icon arrow-right`).child(
        h('div', `${cssPrefix}-icon-img arrow-down`),
      ) : '',
    );
    this.children(this.headerEl, this.contentEl);
  }

  setContentChildren(...children:Element<HTMLDivElement>[]) {
    this.contentEl.html('');
    if (children.length > 0) {
      this.contentEl.children(...children);
    }
  }

  setTitle(title:string) {
    this.title.html(title);
    this.hide();
  }

  show() {
    const { contentEl } = this;
    contentEl.show();
    this.parent().active();
    bindClickoutside(this.parent(), () => {
      this.hide();
    });

    return this
  }

  hide() {
    this.parent().active(false);
    this.contentEl.hide();
    unbindClickoutside(this.parent());

    return this
  }
}
