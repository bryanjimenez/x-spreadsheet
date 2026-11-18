import Dropdown from "./dropdown.ts";
import Icon from "./icon.ts";
import { h } from "./element.ts";
import { baseFormulas } from "../core/formula.ts";
import { cssPrefix } from "../config.ts";

export default class DropdownFormula extends Dropdown {
  constructor() {
    const nformulas = baseFormulas.map((it) =>
      h("div", `${cssPrefix}-item`)
        .on("click", () => {
          this.hide();
          this.change(it);
        })
        .child(it.key)
    );
    super(new Icon("formula"), "180px", true, "bottom-left", ...nformulas);
  }
}
