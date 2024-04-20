import DropdownItem from "./dropdown_item";
import DropdownAlign from "../dropdown_align";

export default class Align extends DropdownItem<DropdownAlign> {
  constructor(value: string) {
    super("align", "", value);
  }

  dropdown() {
    const { value } = this;
    if (value === undefined) {
      throw new Error("Expected initialized value");
    }
    return new DropdownAlign(["left", "center", "right"], value);
  }
}
