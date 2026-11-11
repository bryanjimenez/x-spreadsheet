import ToggleItem from "./toggle_item.ts";

export default class Paintformat extends ToggleItem {
  constructor() {
    super("paintformat");
  }

  // @ts-expect-error override super
  private setState() {}
}
