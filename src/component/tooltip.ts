/* global document */
import { h } from "./element";
import { bind } from "./event";
import { cssPrefix } from "../config";

export default function tooltip(html: string, target: EventTarget) {
  if (!("classList" in target) || !("getBoundingClientRect" in target)) {
    throw new Error("target is not an Element");
  }

  const targetEl = target as HTMLDivElement;

  if (targetEl.classList.contains("active")) {
    return;
  }
  const { left, top, width, height } = targetEl.getBoundingClientRect();
  const el = h("div", `${cssPrefix}-tooltip`).html(html).show();
  document.body.appendChild(el.el);
  const elBox = el.box();
  // console.log('elBox:', elBox);
  el.css("left", `${String(left + width / 2 - elBox.width / 2)}px`).css(
    "top",
    `${String(top + height + 2)}px`
  );

  bind(targetEl, "mouseleave", () => {
    if (document.body.contains(el.el)) {
      document.body.removeChild(el.el);
    }
  });

  bind(targetEl, "click", () => {
    if (document.body.contains(el.el)) {
      document.body.removeChild(el.el);
    }
  });
}
