import { type Element, h } from "./element";
import Icon from "./icon";
import DropdownColor from "./dropdown_color";
import DropdownLineType from "./dropdown_linetype";
import { cssPrefix } from "../config";

function buildTable(...trs: unknown[]) {
  return h("table", "").child(h("tbody", "").children(...trs));
}

export type BorderType =
  | "all"
  | "inside"
  | "horizontal"
  | "vertical"
  | "outside"
  | "left"
  | "top"
  | "right"
  | "bottom"
  | "none";

export default class BorderPalette {
  color: string;
  style: string;
  mode: BorderType;
  change: ({
    mode,
    style,
    color,
  }: {
    mode: BorderType;
    style: string;
    color: string;
  }) => void;
  ddColor: DropdownColor;
  ddType: DropdownLineType;
  el: Element<HTMLDivElement>;

  constructor() {
    this.color = "#000";
    this.style = "thin";
    this.mode = "all";
    this.change = () => {};
    this.ddColor = new DropdownColor("line-color", this.color);
    this.ddColor.change = (color: string) => {
      this.color = color;
    };
    this.ddType = new DropdownLineType(this.style);
    this.ddType.change = (...s: string[]) => {
      const [ltype] = s;
      this.style = ltype;
    };
    this.el = h("div", `${cssPrefix}-border-palette`);
    const table = buildTable(
      h("tr", "").children(
        h("td", `${cssPrefix}-border-palette-left`).child(
          buildTable(
            h("tr", "").children(
              ...(
                [
                  "all",
                  "inside",
                  "horizontal",
                  "vertical",
                  "outside",
                ] as BorderType[]
              ).map((it) => this.buildTd(it))
            ),
            h("tr", "").children(
              ...(
                ["left", "top", "right", "bottom", "none"] as BorderType[]
              ).map((it) => this.buildTd(it))
            )
          )
        ),
        h("td", `${cssPrefix}-border-palette-right`).children(
          h("div", `${cssPrefix}-toolbar-btn`).child(this.ddColor.el),
          h("div", `${cssPrefix}-toolbar-btn`).child(this.ddType.el)
        )
      )
    );
    this.el.child(table);
  }

  private buildTd(iconName: BorderType) {
    return h("td", "").child(
      h("div", `${cssPrefix}-border-palette-cell`)
        .child(new Icon(`border-${iconName}`))
        .on("click", () => {
          this.mode = iconName;
          const { mode, style, color } = this;
          const [styleName] = style;
          this.change({ mode, style: styleName, color });
        })
    );
  }
}
