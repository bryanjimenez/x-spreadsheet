import DropdownItem from "./dropdown_item";
import DropdownFormula from "../dropdown_formula";

export default class Format extends DropdownItem<DropdownFormula> {
  constructor() {
    super("formula");
  }

  getValue(it: unknown): string {
    if (
      !it ||
      typeof it !== "object" ||
      !("key" in it) ||
      typeof it.key !== "string"
    ) {
      throw new Error("Expected Formula name");
    }
    return it.key;
  }

  dropdown() {
    return new DropdownFormula();
  }
}
