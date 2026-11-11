import DropdownItem from "./dropdown_item.ts";
import DropdownFontsize from "../dropdown_fontsize.ts";
import { isNumber } from "../../core/helper.ts";

export default class Format extends DropdownItem<DropdownFontsize> {
  constructor() {
    super("font-size");
  }

  getValue(it: unknown): number {
    if (!it || typeof it !== "object" || !("pt" in it)) {
      throw new Error("Expected font pt");
    }
    const size = it.pt;
    if (!isNumber(size)) {
      throw new Error("Expected size to be a number");
    }
    return Number(size);
  }

  dropdown() {
    return new DropdownFontsize();
  }
}
