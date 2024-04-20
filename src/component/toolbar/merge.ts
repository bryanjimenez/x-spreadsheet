import ToggleItem from "./toggle_item";

export default class Merge extends ToggleItem {
  constructor() {
    super("merge");
  }

  //@ts-expect-error super method override
  setState(active: boolean, disabled: boolean) {
    this.el.active(active).disabled(disabled);
  }
}
