import Dropdown from "../dropdown.ts";
import DropdownItem from "./dropdown_item.ts";

import { cssPrefix } from "../../config.ts";
import { Element, h } from "../element.ts";
import Icon from "../icon.ts";

export class DropdownMore extends Dropdown {
  moreBtns: Element<HTMLDivElement>;

  constructor() {
    const icon = new Icon("ellipsis");
    const moreBtns = h("div", `${cssPrefix}-toolbar-more`);
    super(icon, "auto", false, "bottom-right", moreBtns);
    this.moreBtns = moreBtns;
    this.contentEl.css("max-width", "420px");
  }
}

export default class More extends DropdownItem<DropdownMore> {
  constructor() {
    super("more");
    this.el.hide();
  }

  dropdown() {
    return new DropdownMore();
  }

  show() {
    this.el.show();
  }

  hide() {
    this.el.hide();
  }
}
