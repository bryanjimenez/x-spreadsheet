import ToggleItem from "./toggle_item";

export default class Autofilter extends ToggleItem {
  constructor() {
    super("autofilter");
  }

  // @ts-expect-error override super
  setState(_active?: boolean) {}
}
