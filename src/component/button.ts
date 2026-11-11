import Element from "./element.ts";
import { cssPrefix } from "../config.ts";
import { t } from "../locale/locale.ts";

export default class Button extends Element<HTMLDivElement> {
  // type: primary
  constructor(title: string, type = "") {
    super("div", `${cssPrefix}-button ${type}`);
    this.child(t(`button.${title}`));
  }
}
