import ToggleItem from "./toggle_item.ts";

export default class Bold extends ToggleItem {
  constructor() {
    super("font-bold", "Ctrl+B");
  }
}
