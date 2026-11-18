import DropdownItem from "./dropdown_item.ts";
import DropdownBorder from "../dropdown_border.ts";

export default class Border extends DropdownItem<DropdownBorder> {
  constructor() {
    super("border");
  }

  dropdown() {
    return new DropdownBorder();
  }
}
