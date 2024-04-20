import { type Element, h } from "./element";
import { cssPrefix } from "../config";

export default class FormInput {
  el: Element<HTMLDivElement>;
  vchange: (evt: Event) => void;
  input: Element<HTMLInputElement>;

  constructor(width: string, hint: string) {
    this.vchange = () => {};
    this.el = h("div", `${cssPrefix}-form-input`);
    this.input = h("input", "")
      .css("width", width)
      .on("input", (evt: Event) => {
        this.vchange(evt);
      })
      .attr("placeholder", hint);
    this.el.child(this.input);
  }

  focus() {
    setTimeout(() => {
      this.input.el.focus();
    }, 10);
  }

  hint(v: string) {
    this.input.attr("placeholder", v);
  }

  /** getVal */
  val(): string;
  /** setVal */
  val(v: string): Element<HTMLInputElement>;
  val(v?: string) {
    let o;
    if (v === undefined) {
      o = this.input.val();
    } else {
      o = this.input.val(v);
    }

    return o;
  }
}
