import DropdownItem from "./dropdown_item";
import DropdownFontsize from "../dropdown_fontsize";

export default class Format extends DropdownItem<DropdownFontsize> {
  constructor() {
    super("font-size");
  }

  getValue(it: unknown): number {
    if (!it || typeof it !== "object" || !("pt" in it)) {
      throw new Error("Expected font pt");
    }
    return it.pt;
  }

  dropdown() {
    return new DropdownFontsize();
  }
}
