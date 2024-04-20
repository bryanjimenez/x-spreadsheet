/* global window document */
import { type Element, h } from "./element";
import { cssPrefix } from "../config";
import Button from "./button";
import { Draw } from "../canvas/draw";
import { renderCell } from "./table";
import { t } from "../locale/locale";
import type DataProxy from "../core/data_proxy";
import { type CellRangePoints } from "../core/cell_range";

// resolution: 72 => 595 x 842
// 150 => 1240 x 1754
// 200 => 1654 x 2339
// 300 => 2479 x 3508
// 96 * cm / 2.54 , 96 * cm / 2.54

const PAGER_SIZES: [string, number, number][] = [
  ["A3", 11.69, 16.54],
  ["A4", 8.27, 11.69],
  ["A5", 5.83, 8.27],
  ["B4", 9.84, 13.9],
  ["B5", 6.93, 9.84],
];

const PAGER_ORIENTATIONS = ["landscape", "portrait"];

function inches2px(inc: number) {
  return Math.trunc(96 * inc);
}

export default class Print {
  el: Element<HTMLDivElement>;
  paper: {
    w: number;
    h: number;
    orientation: string;
    width: number;
    height: number;
    padding: number;
  };
  data: DataProxy;
  canvases?: HTMLCanvasElement[];
  contentEl: Element<HTMLDivElement>;

  constructor(data: DataProxy) {
    this.paper = {
      w: inches2px(PAGER_SIZES[0][1]),
      h: inches2px(PAGER_SIZES[0][2]),
      padding: 50,
      orientation: PAGER_ORIENTATIONS[0],
      get width() {
        return this.orientation === "landscape" ? this.h : this.w;
      },
      get height() {
        return this.orientation === "landscape" ? this.w : this.h;
      },
    };
    this.data = data;
    this.el = h("div", `${cssPrefix}-print`)
      .children(
        h("div", `${cssPrefix}-print-bar`).children(
          h("div", "-title").child("Print settings"),
          h("div", "-right").children(
            h("div", `${cssPrefix}-buttons`).children(
              new Button("cancel").on("click", () => {
                this.btnClick("cancel");
              }),
              new Button("next", "primary").on("click", () => {
                this.btnClick("next");
              })
            )
          )
        ),
        h("div", `${cssPrefix}-print-content`).children(
          (this.contentEl = h("div", "-content")),
          h("div", "-sider").child(
            h("form", "").children(
              h("fieldset", "").children(
                h("label", "").child(t("print.size")),
                h("select", "")
                  .children(
                    ...PAGER_SIZES.map((it, index) =>
                      h("option", "")
                        .attr("value", String(index))
                        .child(`${it[0]} ( ${it[1]}''x${it[2]}'' )`)
                    )
                  )
                  .on("change", this.pagerSizeChange.bind(this))
              ),
              h("fieldset", "").children(
                h("label", "").child(t("print.orientation")),
                h("select", "")
                  .children(
                    ...PAGER_ORIENTATIONS.map((it, index) =>
                      h("option", "")
                        .attr("value", String(index))
                        .child(t("print.orientations")[index])
                    )
                  )
                  .on("change", this.pagerOrientationChange.bind(this))
              )
            )
          )
        )
      )
      .hide();
  }

  private btnClick(type: string) {
    console.log(this);
    if (type === "cancel") {
      this.el.hide();
    } else {
      this.toPrint();
    }
  }

  private pagerSizeChange({ target }: Event) {
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error("Expected target HTMLSelectElement");
    }
    const { paper } = this;
    const { value } = target;
    const index = parseInt(value, 10);
    const ps = PAGER_SIZES[index];
    paper.w = inches2px(ps[1]);
    paper.h = inches2px(ps[2]);
    // console.log('paper:', ps, paper);
    this.preview();
  }
  private pagerOrientationChange({ target }: Event) {
    if (!(target instanceof HTMLSelectElement)) {
      throw new Error("Expected target HTMLSelectElement");
    }
    const { paper } = this;
    const { value } = target;
    const index = parseInt(value, 10);
    const v = PAGER_ORIENTATIONS[index];
    paper.orientation = v;
    this.preview();
  }

  resetData(data: DataProxy) {
    this.data = data;
  }

  preview() {
    const { data, paper } = this;
    const { width, height, padding } = paper;
    const iwidth = width - padding * 2;
    const iheight = height - padding * 2;
    const cr = data.contentRange();
    const pages = Math.trunc(cr.h / iheight) + 1;
    const scale = iwidth / cr.w;
    let left = padding;
    const top = padding;
    if (scale > 1) {
      left += (iwidth - cr.w) / 2;
    }
    let ri = 0;
    let yoffset = 0;
    this.contentEl.html("");
    this.canvases = [];
    const mViewRange: CellRangePoints = {
      sri: 0,
      sci: 0,
      eri: 0,
      eci: 0,
    };
    for (let i = 0; i < pages; i += 1) {
      let th = 0;
      let yo = 0;
      const wrap = h("div", `${cssPrefix}-canvas-card`);
      const canvas = h<HTMLCanvasElement>("canvas", `${cssPrefix}-canvas`);
      const cEl = canvas.el;
      this.canvases.push(cEl);
      const draw = new Draw(cEl, width, height);
      // cell-content
      draw.save();
      draw.translate(left, top);
      if (scale < 1) draw.scale(scale, scale);
      // console.log('ri:', ri, cr.eri, yoffset);
      for (; ri <= cr.eri; ri += 1) {
        const rh = data.rows.getHeight(ri);
        th += rh;
        if (th < iheight) {
          for (let ci = 0; ci <= cr.eci; ci += 1) {
            renderCell(draw, data, ri, ci, yoffset);
            mViewRange.eci = ci;
          }
        } else {
          yo = -(th - rh);
          break;
        }
      }
      mViewRange.eri = ri;
      draw.restore();
      // merge-cell
      draw.save();
      draw.translate(left, top);
      if (scale < 1) draw.scale(scale, scale);
      const yof = yoffset;
      data.eachMergesInView(
        mViewRange,
        ({ sri, sci }: { sri: number; sci: number }) => {
          renderCell(draw, data, sri, sci, yof);
        }
      );
      draw.restore();

      mViewRange.sri = mViewRange.eri;
      mViewRange.sci = mViewRange.eci;
      yoffset += yo;
      this.contentEl.child(
        h("div", `${cssPrefix}-canvas-card-wraper`).child(wrap.child(canvas))
      );
    }
    this.el.show();
  }

  toPrint() {
    this.el.hide();
    const { paper } = this;
    const iframe = h<HTMLIFrameElement>("iframe", "").hide();
    const { el } = iframe;
    window.document.body.appendChild(el);
    const { contentWindow } = el;
    if (contentWindow === null) {
      throw new Error("Expected iframe contentWindow");
    }
    const idoc = contentWindow.document;
    const style = document.createElement("style");
    style.innerHTML = `
      @page { size: ${paper.width}px ${paper.height}px; };
      canvas {
        page-break-before: auto;        
        page-break-after: always;
        image-rendering: pixelated;
      };
    `;
    idoc.head.appendChild(style);
    this.canvases?.forEach((it) => {
      const cn = <HTMLCanvasElement>it.cloneNode(false);
      const ctx = cn.getContext("2d");
      // ctx.imageSmoothingEnabled = true;
      ctx?.drawImage(it, 0, 0);
      idoc.body.appendChild(cn);
    });
    contentWindow.print();
  }
}
