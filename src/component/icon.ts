import Element, { h } from "./element.ts";
import { cssPrefix } from "../config.ts";

export default class Icon extends Element<HTMLElement> {
  iconNameEl: Element<HTMLDivElement>;

  constructor(name: string) {
    super("div", `${cssPrefix}-icon`);
    this.iconNameEl = h("div", `${cssPrefix}-icon-img ${name}`);
    this.child(this.iconNameEl);
  }

  setName(name: string) {
    this.iconNameEl.className(`${cssPrefix}-icon-img ${name}`);
  }
}
