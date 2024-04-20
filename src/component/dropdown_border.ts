import Dropdown from "./dropdown";
import Icon from "./icon";
import BorderPalette, { type BorderType } from "./border_palette";

export default class DropdownBorder extends Dropdown {
  constructor() {
    const icon = new Icon("border-all");
    const borderPalette = new BorderPalette();
    borderPalette.change = (v: {
      mode: BorderType;
      style: string;
      color: string;
    }) => {
      this.change(v);
      this.hide();
    };
    super(icon, "auto", false, "bottom-left", borderPalette.el);
  }
}
