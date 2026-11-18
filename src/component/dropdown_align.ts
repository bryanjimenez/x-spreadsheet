import Dropdown from "./dropdown.ts";
import { h } from "./element.ts";
import Icon from "./icon.ts";
import { cssPrefix } from "../config.ts";

function buildItemWithIcon(iconName: string) {
  return h("div", `${cssPrefix}-item`).child(new Icon(iconName));
}

export default class DropdownAlign extends Dropdown {
  constructor(aligns: string[], align: string) {
    const icon = new Icon(`align-${align}`);
    const naligns = aligns.map((it) =>
      buildItemWithIcon(`align-${it}`).on("click", () => {
        this.setTitle(it);
        this.change(it);
      })
    );
    super(icon, "auto", true, "bottom-left", ...naligns);
  }

  setTitle(align: string) {
    if (this.title instanceof Icon) {
      this.title.setName(`align-${align}`);
    }
    this.hide();
  }
}
