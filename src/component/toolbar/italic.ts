import ToggleItem from "./toggle_item.ts";

export default class Italic extends ToggleItem {
  constructor() {
    super("font-italic", "Ctrl+I");
  }
}
