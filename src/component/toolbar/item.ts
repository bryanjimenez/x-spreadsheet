import { cssPrefix } from "../../config";
import { t } from "../../locale/locale";
import { Element, h } from "../element";
import tooltip from "../tooltip";

export default class Item {
  tip: string;
  tag: string;
  shortcut?: string;
  value?: string;
  el: Element<HTMLDivElement>;
  change: (...args: unknown[]) => void;
  // tooltip
  // tag: the subclass type
  // shortcut: shortcut key
  constructor(tag: string, shortcut?: string, value?: string) {
    this.tip = "";
    if (tag)
      this.tip = t(
        `toolbar.${tag.replace(/-[a-z]/gu, (c) => c[1].toUpperCase())}`
      );
    if (shortcut) this.tip += ` (${shortcut})`;
    this.tag = tag;
    this.shortcut = shortcut;
    this.value = value;
    this.el = this.element();
    this.change = () => {};
  }

  element() {
    const { tip } = this;

    const el = h("div", `${cssPrefix}-toolbar-btn`);

    const handler: EventListener = (evt) => {
      if (this.tip && evt.target) tooltip(this.tip, evt.target);
    };

    el.on("mouseenter", handler).attr("data-tooltip", tip);

    return el;
  }

  // setState() {}
}
