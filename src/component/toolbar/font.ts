import DropdownItem from "./dropdown_item";
import DropdownFont from "../dropdown_font";

export default class Font extends DropdownItem<DropdownFont> {
  constructor() {
    super("font-name");
  }

  getValue(it: unknown): string {
    if (
      !it ||
      typeof it !== "object" ||
      !("key" in it) ||
      typeof it.key !== "string"
    ) {
      throw new Error("Expected Font name");
    }
    return it.key;
  }

  dropdown() {
    return new DropdownFont();
  }
}
