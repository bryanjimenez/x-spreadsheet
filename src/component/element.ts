/* global document */
/* global window */
import { type Offset } from "./selector";

class Element<T extends HTMLElement> {
  el: T;
  value?: string;
  xclickoutside?: (evt: MouseEvent) => void;
  dataV: Record<string, string>;

  constructor(tag: string | Node | Element<T> | HTMLElement, className = "") {
    if (typeof tag === "string") {
      this.el = document.createElement(tag);
      this.el.className = className;
    } else {
      this.el = tag as T;
    }
    this.dataV = {};
  }

  data(key: string, value: string): this;
  data(key: string): string;
  data(key: string, value?: string): this | string {
    if (value !== undefined) {
      this.dataV[key] = value;
      return this;
    }
    return this.dataV[key];
  }

  on<T extends Event>(eventNames: string, handler: ({ target }: T) => void) {
    const [fen, ...oen] = eventNames.split(".");
    let eventName = fen;
    if (
      eventName === "mousewheel" &&
      /Firefox/i.test(window.navigator.userAgent)
    ) {
      eventName = "DOMMouseScroll";
    }
    this.el.addEventListener(eventName, (evt: Event) => {
      handler(evt);
      for (let i = 0; i < oen.length; i += 1) {
        const k = oen[i];
        if (k === "left" && evt.button !== 0) {
          return;
        }
        if (k === "right" && evt.button !== 2) {
          return;
        }
        if (k === "stop") {
          evt.stopPropagation();
        }
      }
    });
    return this;
  }

  // overload function signatures
  /**
   * getOffset
   */
  offset(): {
    top: number;
    left: number;
    height: number;
    width: number;
  };
  /**
   * setOffset
   * @param value
   */
  offset(value: Offset): this;
  offset(value?: Offset) {
    if (value !== undefined) {
      const keys = Object.keys(value) as (keyof Offset)[];
      keys.forEach((k) => {
        this.css(k, `${value[k]}px`);
      });
      return this;
    }
    const { offsetTop, offsetLeft, offsetHeight, offsetWidth } = this.el;
    return {
      top: offsetTop,
      left: offsetLeft,
      height: offsetHeight,
      width: offsetWidth,
    };
  }

  scroll<T extends { left?: number; top?: number }>(v?: T) {
    const { el } = this;
    if (v !== undefined) {
      if (v.left !== undefined) {
        el.scrollLeft = v.left;
      }
      if (v.top !== undefined) {
        el.scrollTop = v.top;
      }
    }
    return { left: el.scrollLeft, top: el.scrollTop };
  }

  box() {
    return this.el.getBoundingClientRect();
  }

  parent() {
    const n = this.el.parentNode as Node;
    return new Element(n);
  }

  children(): NodeListOf<ChildNode>;
  children(...eles: unknown[]): this;
  children(...eles: unknown[]) {
    if (arguments.length === 0) {
      return this.el.childNodes;
    }
    eles.forEach((ele) => this.child(ele));
    return this;
  }

  removeChild(el: HTMLElement) {
    this.el.removeChild(el);
  }

  /*
  first() {
    return this.el.firstChild;
  }

  last() {
    return this.el.lastChild;
  }

  remove(ele) {
    return this.el.removeChild(ele);
  }

  prepend(ele) {
    const { el } = this;
    if (el.children.length > 0) {
      el.insertBefore(ele, el.firstChild);
    } else {
      el.appendChild(ele);
    }
    return this;
  }

  prev() {
    return this.el.previousSibling;
  }

  next() {
    return this.el.nextSibling;
  }
  */

  child(arg: unknown) {
    let ele = arg;
    if (typeof arg === "string") {
      ele = document.createTextNode(arg);
    } else if (arg instanceof Element) {
      ele = arg.el;
    }
    this.el.appendChild(ele as Node);
    return this;
  }

  contains(ele: HTMLElement) {
    return this.el.contains(ele);
  }

  className(v: string) {
    if (v !== undefined) {
      this.el.className = v;
      return this;
    }
    return this.el.className;
  }

  addClass(name: string) {
    this.el.classList.add(name);
    return this;
  }

  hasClass(name: string) {
    return this.el.classList.contains(name);
  }

  removeClass(name: string) {
    this.el.classList.remove(name);
    return this;
  }

  toggle(cls = "active") {
    return this.toggleClass(cls);
  }

  toggleClass(name: string) {
    return this.el.classList.toggle(name);
  }

  active(flag = true, cls = "active") {
    if (flag) this.addClass(cls);
    else this.removeClass(cls);
    return this;
  }

  checked(flag = true) {
    this.active(flag, "checked");
    return this;
  }

  disabled(flag = true) {
    if (flag) this.addClass("disabled");
    else this.removeClass("disabled");
    return this;
  }

  // key, value
  // key
  // {k, v}...
  attr(key: string): string;
  attr(key: Record<string, unknown>): this;
  attr(key: string, value: string): this;
  attr(key: string | Record<string, unknown>, value?: string) {
    if (value !== undefined && typeof key === "string") {
      this.el.setAttribute(key, value);
    } else {
      if (typeof key === "string") {
        return this.el.getAttribute(key);
      }
      Object.keys(key).forEach((k) => {
        this.el.setAttribute(k, key[k] as string);
      });
    }
    return this;
  }

  removeAttr(key: string) {
    this.el.removeAttribute(key);
    return this;
  }

  html(): string;
  html(content: string): this;
  html(content?: string) {
    if (content !== undefined) {
      this.el.innerHTML = content;
      return this;
    }
    return this.el.innerHTML;
  }

  val(): string;
  val(v: string): this;
  // implementation
  val(v?: string) {
    if (v !== undefined) {
      this.el.value = v;
      return this;
    }
    return this.el.value;
  }

  focus() {
    this.el.focus();
  }

  cssRemoveKeys(...keys: string[]) {
    keys.forEach((k) => this.el.style.removeProperty(k));
    return this;
  }

  // css( propertyName )
  // css( propertyName, value )
  // css( properties )
  css(name: string): string;
  css(name: string, value: string): this;
  css(name: string, value?: string) {
    if (value === undefined && typeof name !== "string") {
      (Object.keys(name) as (keyof CSSStyleDeclaration)[]).forEach((k) => {
        if (k !== "length" && k !== "parentRule") {
          this.el.style[k] = name[k];
        }
      });
      return this;
    }
    if (value !== undefined) {
      this.el.style[name] = value;
      return this;
    }
    return this.el.style[name];
  }

  computedStyle() {
    return window.getComputedStyle(this.el, null);
  }

  show() {
    this.css("display", "block");
    return this;
  }

  hide() {
    this.css("display", "none");
    return this;
  }
}

const h = <T extends HTMLElement = HTMLDivElement>(
  tag: string | HTMLElement,
  className = ""
) => new Element<T>(tag, className);

export { Element, h };
