import Item from "./item";
import Icon from "../icon";

export default class IconItem extends Item {
  element() {
    const p = super.element();
    if (p !== null && typeof p !== "string") {
      return p.child(new Icon(this.tag)).on("click", () => {
        this.change(this.tag);
      });
    }
    throw new Error("IconItem missing parent Element");
    // return super.element()
    //   .child(new Icon(this.tag))
    //   .on('click', () => this.change(this.tag));
  }

  setState(disabled: boolean) {
    this.el.disabled(disabled);
  }
}
