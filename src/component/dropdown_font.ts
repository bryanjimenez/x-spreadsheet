import Dropdown from "./dropdown.ts";
import { h } from "./element.ts";
import { baseFonts } from "../core/font.ts";
import { cssPrefix } from "../config.ts";

export default class DropdownFont extends Dropdown {
  constructor() {
    const nfonts = baseFonts.map((it) =>
      h("div", `${cssPrefix}-item`)
        .on("click", () => {
          this.setTitle(it.title);
          this.change(it);
        })
        .child(it.title)
    );
    super(baseFonts[0].title, "160px", true, "bottom-left", ...nfonts);
  }
}
