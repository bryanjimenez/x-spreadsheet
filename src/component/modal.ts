/* global document */
/* global window */
import { type Element, h } from "./element";
import Icon from "./icon";
import { cssPrefix } from "../config";
import { bind, unbind } from "./event";

export default class Modal {
  el: Element<HTMLDivElement>;
  title: string;
  dimmer?: Element<HTMLDivElement>;

  constructor(
    title: string,
    content: Element<HTMLDivElement>[],
    width = "600px"
  ) {
    this.title = title;
    this.el = h("div", `${cssPrefix}-modal`)
      .css("width", width)
      .children(
        h("div", `${cssPrefix}-modal-header`).children(
          new Icon("close").on("click.stop", () => {
            this.hide();
          }),
          this.title
        ),
        h("div", `${cssPrefix}-modal-content`).children(...content)
      )
      .hide();
  }

  show() {
    // dimmer
    this.dimmer = h("div", `${cssPrefix}-dimmer active`);
    document.body.appendChild(this.dimmer.el);
    const { width, height } = this.el.show().box();
    const { clientHeight, clientWidth } = document.documentElement;
    this.el.offset({
      left: (clientWidth - width) / 2,
      top: (clientHeight - height) / 3,
    });
    bind(window, "keydown", this.xkeydownEsc);
  }

  hide() {
    this.el.hide();
    if (this.dimmer) {
      document.body.removeChild(this.dimmer.el);
    }
    unbind(window, "keydown", this.xkeydownEsc);
  }

  private xkeydownEsc = (evt: Event) => {
    if (evt instanceof KeyboardEvent && evt.keyCode === 27) {
      this.hide();
    }
  };
}
