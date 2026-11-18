import Dropdown from "./dropdown.ts";
import { h } from "./element.ts";
import { type BaseFormats, baseFormats } from "../core/format.ts";
import { cssPrefix } from "../config.ts";

export default class DropdownFormat extends Dropdown {
  constructor() {
    const nformats: (BaseFormats | { key: string })[] = baseFormats.slice(0);
    nformats.splice(2, 0, { key: "divider" });
    nformats.splice(8, 0, { key: "divider" });
    const nformatsEl = nformats.map((it) => {
      const item = h("div", `${cssPrefix}-item`);
      if (!("render" in it)) {
        item.addClass("divider");
      } else {
        item.child(it.title()).on("click", () => {
          this.setTitle(it.title());
          this.change(it);
        });
        if (it.label) item.child(h("div", "label").setHTML(it.label));
      }
      return item;
    });
    super("Normal", "220px", true, "bottom-left", ...nformatsEl);
  }

  setTitle(key: string) {
    for (let i = 0; i < baseFormats.length; i += 1) {
      if (baseFormats[i].key === key) {
        this.title.setHTML(baseFormats[i].title());
      }
    }
    this.hide();
  }
}
