import Dropdown from "./dropdown.ts";
import { h } from "./element.ts";
import { fontSizes } from "../core/font.ts";
import { cssPrefix } from "../config.ts";

export default class DropdownFontSize extends Dropdown {
  constructor() {
    const nfontSizes = fontSizes.map((it) =>
      h("div", `${cssPrefix}-item`)
        .on("click", () => {
          this.setTitle(String(it.pt));
          this.change(it);
        })
        .child(String(it.pt))
    );
    super("10", "60px", true, "bottom-left", ...nfontSizes);
  }
}
