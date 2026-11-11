import Item from "./item.ts";
import Icon from "../icon.ts";

export default class ToggleItem extends Item {
  element() {
    const { tag } = this;
    return super
      .element()
      .child(new Icon(tag))
      .on("click", () => {
        this.click();
      });
  }

  click() {
    this.change(this.tag, this.toggle());
  }

  setState(active?: boolean) {
    if (typeof this.el === "string" || !this.el) {
      return null;
    }

    this.el.active(active);
  }

  toggle() {
    if (typeof this.el === "string" || !this.el) {
      return null;
    }

    return this.el.toggle();
  }

  active() {
    if (typeof this.el === "string" || !this.el) {
      return null;
    }
    return this.el.hasClass("active");
  }
}
