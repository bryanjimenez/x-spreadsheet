/* global window */
import ContextMenu from "./contextmenu";
import Editor from "./editor";
import { Element, h } from "./element";
import { bind, bindTouch, createEventEmitter, mouseMoveUp } from "./event";
import { xtoast } from "./message";
import ModalValidation from "./modal_validation";
import Print from "./print";
import Resizer from "./resizer";
import Scrollbar from "./scrollbar";
import Selector from "./selector";
import SortFilter from "./sort_filter";
import Table from "./table";
import Toolbar from "./toolbar/index";
import { cssPrefix } from "../config";
import { formulas } from "../core/formula";
import DataProxy from "../core/data_proxy";
import { type ToolBarChangeType } from "./toolbar";
import { type Operator } from "../core/auto_filter";
import { type SheetData } from "..";

export type Direction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "row-first"
  | "row-last"
  | "col-first"
  | "col-last";
type InsertType =
  | "insert-row"
  | "delete-row"
  | "insert-column"
  | "delete-column"
  | "delete-cell"
  | "delete-cell-format"
  | "delete-cell-text"
  | "cell-printable"
  | "cell-non-printable"
  | "cell-editable"
  | "cell-non-editable";

class Sheet {
  data: DataProxy;
  table: Table;
  eventMap: ReturnType<typeof createEventEmitter>;
  el: Element<HTMLDivElement>;
  toolbar: Toolbar;
  print: Print;
  tableEl: Element<HTMLCanvasElement>;
  rowResizer: Resizer;
  colResizer: Resizer;
  verticalScrollbar: Scrollbar;
  horizontalScrollbar: Scrollbar;
  editor: Editor;
  modalValidation: ModalValidation;
  contextMenu: ContextMenu;
  selector: Selector;
  overlayerCEl: Element<HTMLDivElement>;
  overlayerEl: Element<HTMLDivElement>;
  sortFilter: SortFilter;
  focusing?: boolean;

  constructor(targetEl: Element<HTMLDivElement>, data: DataProxy) {
    this.eventMap = createEventEmitter();
    const { view, showToolbar, showContextmenu } = data.settings;
    this.el = h("div", `${cssPrefix}-sheet`);
    this.toolbar = new Toolbar(data, view.width, !showToolbar);
    this.print = new Print(data);
    targetEl.children(this.toolbar.el, this.el, this.print.el);
    this.data = data;
    // table
    this.tableEl = h<HTMLCanvasElement>("canvas", `${cssPrefix}-table`);
    // resizer
    this.rowResizer = new Resizer(false, data.rows.height);
    this.colResizer = new Resizer(true, data.cols.minWidth);
    // scrollbar
    this.verticalScrollbar = new Scrollbar(true);
    this.horizontalScrollbar = new Scrollbar(false);
    // editor
    this.editor = new Editor(
      formulas,
      () => this.getTableOffset(),
      data.rows.height
    );
    // data validation
    this.modalValidation = new ModalValidation();
    // contextMenu
    this.contextMenu = new ContextMenu(() => this.getRect(), !showContextmenu);
    // selector
    this.selector = new Selector(data);
    this.overlayerCEl = h("div", `${cssPrefix}-overlayer-content`);
    this.overlayerCEl.children(this.editor.el, this.selector.el);
    this.overlayerEl = h("div", `${cssPrefix}-overlayer`).child(
      this.overlayerCEl
    );
    // sortFilter
    this.sortFilter = new SortFilter();
    // root element
    this.el.children(
      this.tableEl,
      this.overlayerEl.el,
      this.rowResizer.el,
      this.colResizer.el,
      this.verticalScrollbar.el,
      this.horizontalScrollbar.el,
      this.contextMenu.el,
      this.modalValidation.el,
      this.sortFilter.el
    );
    // table
    this.table = new Table(this.tableEl.el, data);
    this.sheetInitEvents();
    this.sheetReset();
    // init selector [0, 0]
    this.selectorSet(false, 0, 0);
  }

  private sheetInitEvents() {
    const {
      selector,
      overlayerEl,
      rowResizer,
      colResizer,
      verticalScrollbar,
      horizontalScrollbar,
      editor,
      contextMenu,
      toolbar,
      modalValidation,
      sortFilter,
    } = this;
    // overlayer
    overlayerEl
      .on("mousemove", (evt: MouseEvent) => {
        this.overlayerMousemove(evt);
      })
      .on("mousedown", (evt: MouseEvent) => {
        editor.clear();
        contextMenu.hide();
        // the left mouse button: mousedown → mouseup → click
        // the right mouse button: mousedown → contenxtmenu → mouseup
        if (evt.buttons === 2) {
          if (this.data.xyInSelectedRect(evt.offsetX, evt.offsetY)) {
            contextMenu.setPosition(evt.offsetX, evt.offsetY);
          } else {
            this.overlayerMousedown(evt);
            contextMenu.setPosition(evt.offsetX, evt.offsetY);
          }
          evt.stopPropagation();
        } else if (evt.detail === 2) {
          this.editorSet();
        } else {
          this.overlayerMousedown(evt);
        }
      })
      .on("mousewheel.stop", (evt: WheelEvent) => {
        this.overlayerMousescroll(evt);
      })
      .on("mouseout", (evt: MouseEvent) => {
        const { offsetX, offsetY } = evt;
        if (offsetY <= 0) colResizer.hide();
        if (offsetX <= 0) rowResizer.hide();
      });

    selector.inputChange = (v) => {
      this.dataSetCellText(v, "input");
      this.editorSet();
    };

    // slide on mobile
    bindTouch(overlayerEl.el, {
      move: (direction: Direction, d: number) => {
        this.overlayerTouch(direction, d);
      },
      end: () => {},
    });

    // toolbar change
    toolbar.change = (type: ToolBarChangeType, value: unknown) => {
      this.toolbarChange(type, value);
    };

    // sort filter ok
    sortFilter.ok = (
      ci: number | null,
      order: "asc" | "desc" | null,
      o: "in",
      v: string[]
    ) => {
      this.sortFilterChange(ci, order, o, v);
    };

    // resizer finished callback
    rowResizer.finishedFn = (
      cRect: { ri: number; ci: number },
      distance: number
    ) => {
      this.rowResizerFinished(cRect, distance);
    };
    colResizer.finishedFn = (
      cRect: { ri: number; ci: number },
      distance: number
    ) => {
      this.colResizerFinished(cRect, distance);
    };
    // resizer unhide callback
    rowResizer.unhideFn = (index: number) => {
      this.unhideRowsOrCols("row", index);
    };
    colResizer.unhideFn = (index: number) => {
      this.unhideRowsOrCols("col", index);
    };
    // scrollbar move callback
    verticalScrollbar.moveFn = (distance: number) => {
      this.verticalScrollbarMove(distance);
    };
    horizontalScrollbar.moveFn = (distance: number) => {
      this.horizontalScrollbarMove(distance);
    };
    // editor
    editor.change = (state: string, itext: string) => {
      this.dataSetCellText(itext, state);
    };
    // modal validation
    modalValidation.change = (action: string, ...args) => {
      if (action === "save") {
        this.data.addValidation(...args);
      } else {
        this.data.removeValidation();
      }
    };
    // contextmenu
    contextMenu.itemClick = (type: string) => {
      // console.log('type:', type);
      if (type === "validation") {
        modalValidation.setValue(this.data.getSelectedValidation());
      } else if (type === "copy") {
        this.copy();
      } else if (type === "cut") {
        this.cut();
      } else if (type === "paste") {
        this.paste("all");
      } else if (type === "paste-value") {
        this.paste("text");
      } else if (type === "paste-format") {
        this.paste("format");
      } else if (type === "hide") {
        this.hideRowsOrCols();
      } else if (type === "scroll-to-last-row") {
        const y = this.data.rows.len;
        const rowHeight = this.data.rows.height;
        const distance = rowHeight * (y - 4);
        this.verticalScrollbarMove(distance);
      } else {
        this.insertDeleteRowColumn(type);
      }
    };

    bind(window, "resize", () => {
      this.reload();
    });

    bind(window, "click", (evt: Event) => {
      if (evt.target instanceof HTMLElement) {
        this.focusing = overlayerEl.contains(evt.target);
      }
    });

    bind(window, "paste", (evt) => {
      if (!this.focusing) return;
      this.paste("all", evt);
      evt.preventDefault();
    });

    bind(window, "copy", (evt) => {
      if (!this.focusing) return;
      this.copy(evt);
      evt.preventDefault();
    });

    // for selector
    bind(window, "keydown", (evt: KeyboardEvent) => {
      if (!this.focusing) return;
      const keyCode = evt.keyCode || evt.which;
      const { key, ctrlKey, shiftKey, metaKey } = evt;
      // console.log('keydown.evt: ', keyCode);
      if (ctrlKey || metaKey) {
        // const { sIndexes, eIndexes } = selector;
        // let what = 'all';
        // if (shiftKey) what = 'text';
        // if (altKey) what = 'format';
        switch (keyCode) {
          case 90:
            // undo: ctrl + z
            this.undo();
            evt.preventDefault();
            break;
          case 89:
            // redo: ctrl + y
            this.redo();
            evt.preventDefault();
            break;
          case 67:
            // ctrl + c
            // => copy
            // copy();
            // evt.preventDefault();
            break;
          case 88:
            // ctrl + x
            this.cut();
            evt.preventDefault();
            break;
          case 85:
            // ctrl + u
            toolbar.trigger("underline");
            evt.preventDefault();
            break;
          case 86:
            // ctrl + v
            // => paste
            // evt.preventDefault();
            break;
          case 37:
            // ctrl + left
            this.selectorMove(shiftKey, "row-first");
            evt.preventDefault();
            break;
          case 38:
            // ctrl + up
            this.selectorMove(shiftKey, "col-first");
            evt.preventDefault();
            break;
          case 39:
            // ctrl + right
            this.selectorMove(shiftKey, "row-last");
            evt.preventDefault();
            break;
          case 40:
            // ctrl + down
            this.selectorMove(shiftKey, "col-last");
            evt.preventDefault();
            break;
          case 32:
            // ctrl + space, all cells in col
            this.selectorSet(false, -1, this.data.selector.ci, false);
            evt.preventDefault();
            break;
          case 66:
            // ctrl + B
            toolbar.trigger("bold");
            break;
          case 73:
            // ctrl + I
            toolbar.trigger("italic");
            break;
          default:
            break;
        }
      } else {
        // console.log('evt.keyCode:', evt.keyCode);
        switch (keyCode) {
          case 32:
            if (shiftKey) {
              // shift + space, all cells in row
              this.selectorSet(false, this.data.selector.ri, -1, false);
            }
            break;
          case 27: // esc
            contextMenu.hide();
            this.clearClipboard();
            break;
          case 37: // left
            this.selectorMove(shiftKey, "left");
            evt.preventDefault();
            break;
          case 38: // up
            this.selectorMove(shiftKey, "up");
            evt.preventDefault();
            break;
          case 39: // right
            this.selectorMove(shiftKey, "right");
            evt.preventDefault();
            break;
          case 40: // down
            this.selectorMove(shiftKey, "down");
            evt.preventDefault();
            break;
          case 9: // tab
            editor.clear();
            // shift + tab => move left
            // tab => move right
            this.selectorMove(false, shiftKey ? "left" : "right");
            evt.preventDefault();
            break;
          case 13: // enter
            editor.clear();
            // shift + enter => move up
            // enter => move down
            this.selectorMove(false, shiftKey ? "up" : "down");
            evt.preventDefault();
            break;
          case 8: // backspace
            this.insertDeleteRowColumn("delete-cell-text");
            evt.preventDefault();
            break;
          default:
            break;
        }

        if (key === "Delete") {
          this.insertDeleteRowColumn("delete-cell-text");
          evt.preventDefault();
        } else if (
          (keyCode >= 65 && keyCode <= 90) ||
          (keyCode >= 48 && keyCode <= 57) ||
          (keyCode >= 96 && keyCode <= 105) ||
          evt.key === "="
        ) {
          this.dataSetCellText(evt.key, "input");
          this.editorSet();
        } else if (keyCode === 113) {
          // F2
          this.editorSet();
        }
      }
    });
  }

  private sheetReset() {
    const { tableEl, overlayerEl, overlayerCEl, table, toolbar, selector, el } =
      this;
    const tOffset = this.getTableOffset();
    const vRect = this.getRect();
    tableEl.attr(vRect);
    overlayerEl.offset(vRect);
    overlayerCEl.offset(tOffset);
    el.css("width", `${String(vRect.width)}px`);
    this.verticalScrollbarSet();
    this.horizontalScrollbarSet();
    this.sheetFreeze();
    table.render();
    toolbar.reset();
    selector.reset();
  }

  private paste(what: "format" | "all" | "text" | undefined, evt?: Event) {
    const { data } = this;
    if (data.settings.mode === "read") return;
    if (data.clipboard.isClear()) {
      const resetSheet = () => {
        this.sheetReset();
      };
      const eventTrigger = (rows: unknown[]) => {
        this.trigger("pasted-clipboard", rows);
      };
      // pastFromSystemClipboard is async operation, need to tell it how to reset sheet and trigger event after it finishes
      // pasting content from system clipboard
      data.pasteFromSystemClipboard(resetSheet, eventTrigger);
    } else if (
      data.paste(what, (msg: string) => {
        xtoast("Tip", msg);
      })
    ) {
      this.sheetReset();
    } else if (evt && "clipboardData" in evt) {
      const cdata = (evt as ClipboardEvent).clipboardData?.getData(
        "text/plain"
      );
      if (cdata) {
        this.data.pasteFromText(cdata);
        this.sheetReset();
      }
    }
  }

  private overlayerMousedown(evt: MouseEvent) {
    // console.log(':::::overlayer.mousedown:', evt.detail, evt.button, evt.buttons, evt.shiftKey);
    // console.log('evt.target.className:', evt.target.className);
    const { selector, data, table, sortFilter } = this;
    const { offsetX, offsetY } = evt;
    const isAutofillEl =
      evt.target && evt.target.className === `${cssPrefix}-selector-corner`;
    const cellRect = data.getCellRectByXY(offsetX, offsetY);
    const { left, top, width, height } = cellRect;
    let { ri, ci } = cellRect;
    // sort or filter
    const { autoFilter } = data;
    if (autoFilter.includes(ri, ci)) {
      if (left + width - 20 < offsetX && top + height - 20 < offsetY) {
        const items = autoFilter.items(ci, (r: number, c: number) =>
          data.rows.getCell(r, c)
        );
        sortFilter.hide();
        sortFilter.set(
          ci,
          items,
          autoFilter.getFilter(ci),
          autoFilter.getSort(ci)
        );
        sortFilter.setOffset({ left, top: top + height + 2 });
        return;
      }
    }

    // console.log('ri:', ri, ', ci:', ci);
    if (!evt.shiftKey) {
      // console.log('selectorSetStart:::');
      if (isAutofillEl) {
        selector.showAutofill(ri, ci);
      } else {
        this.selectorSet(false, ri, ci);
      }

      // mouse move up
      mouseMoveUp(
        window,
        (e: MouseEvent) => {
          // console.log('mouseMoveUp::::');
          ({ ri, ci } = data.getCellRectByXY(e.offsetX, e.offsetY));
          if (isAutofillEl) {
            selector.showAutofill(ri, ci);
          } else if (e.buttons === 1 && !e.shiftKey) {
            this.selectorSet(true, ri, ci, true, true);
          }
        },
        () => {
          if (
            isAutofillEl &&
            selector.arange &&
            data.settings.mode !== "read"
          ) {
            if (
              data.autofill(selector.arange, "all", (msg: string) => {
                xtoast("Tip", msg);
              })
            ) {
              table.render();
            }
          }
          selector.hideAutofill();
          this.toolbarChangePaintformatPaste();
        }
      );
    }

    if (!isAutofillEl && evt.buttons === 1) {
      if (evt.shiftKey) {
        // console.log('shiftKey::::');
        this.selectorSet(true, ri, ci);
      }
    }
  }

  private selectorSet(
    multiple: boolean,
    ri: number,
    ci: number,
    indexesUpdated = true,
    moving = false
  ) {
    if (ri === -1 && ci === -1) return;
    const { table, selector, toolbar, data, contextMenu } = this;
    const cell = data.getCell(ri, ci);
    if (multiple) {
      selector.setEnd(ri, ci, moving);
      this.trigger("cells-selected", cell, selector.range);
    } else {
      // trigger click event
      selector.set(ri, ci, indexesUpdated);
      this.trigger("cell-selected", cell, ri, ci);
    }
    contextMenu.setMode(ri === -1 || ci === -1 ? "row-col" : "range");
    toolbar.reset();
    table.render();
  }

  // multiple: boolean
  // direction: left | right | up | down | row-first | row-last | col-first | col-last
  private selectorMove(multiple: boolean, direction: Direction) {
    const { selector, data } = this;
    const { rows, cols } = data;
    let [ri, ci] = selector.indexes;
    const { eri, eci } = selector.range;
    if (multiple) {
      if (selector.moveIndexes === undefined) {
        throw new Error("Expected moveIndexes row and column");
      }
      [ri, ci] = selector.moveIndexes;
    }
    // console.log('selector.move:', ri, ci);
    if (direction === "left") {
      if (ci > 0) ci -= 1;
    } else if (direction === "right") {
      if (eci !== ci) ci = eci;
      if (ci < cols.len - 1) ci += 1;
    } else if (direction === "up") {
      if (ri > 0) ri -= 1;
    } else if (direction === "down") {
      if (eri !== ri) ri = eri;
      if (ri < rows.len - 1) ri += 1;
    } else if (direction === "row-first") {
      ci = 0;
    } else if (direction === "row-last") {
      ci = cols.len - 1;
    } else if (direction === "col-first") {
      ri = 0;
    } else if (direction === "col-last") {
      ri = rows.len - 1;
    }
    if (multiple) {
      selector.moveIndexes = [ri, ci];
    }
    this.selectorSet(multiple, ri, ci);
    this.scrollbarMove();
  }

  private scrollbarMove() {
    const { data, verticalScrollbar, horizontalScrollbar } = this;
    const { l, t, left, top, width, height } = data.getSelectedRect();
    if (
      l === undefined ||
      t === undefined ||
      top === undefined ||
      width === undefined ||
      left === undefined
    ) {
      throw new Error("Expected l, t, top, width, and left");
    }

    const tableOffset = this.getTableOffset();
    // console.log(',l:', l, ', left:', left, ', tOffset.left:', tableOffset.width);
    if (Math.abs(left) + width > tableOffset.width) {
      horizontalScrollbar.move({ left: l + width - tableOffset.width });
    } else {
      const fsw = data.freezeTotalWidth();
      if (left < fsw) {
        horizontalScrollbar.move({ left: l - 1 - fsw });
      }
    }
    // console.log('top:', top, ', height:', height, ', tof.height:', tableOffset.height);
    if (height && Math.abs(top) + height > tableOffset.height) {
      verticalScrollbar.move({ top: t + height - tableOffset.height - 1 });
    } else {
      const fsh = data.freezeTotalHeight();
      if (top < fsh) {
        verticalScrollbar.move({ top: t - 1 - fsh });
      }
    }
  }

  private insertDeleteRowColumn(type: InsertType) {
    const { data } = this;
    if (data.settings.mode === "read") return;
    if (type === "insert-row") {
      data.insert("row");
    } else if (type === "delete-row") {
      data.delete("row");
    } else if (type === "insert-column") {
      data.insert("column");
    } else if (type === "delete-column") {
      data.delete("column");
    } else if (type === "delete-cell") {
      data.deleteCell();
    } else if (type === "delete-cell-format") {
      data.deleteCell("format");
    } else if (type === "delete-cell-text") {
      data.deleteCell("text");
    } else if (type === "cell-printable") {
      data.setSelectedCellAttr("printable", true);
    } else if (type === "cell-non-printable") {
      data.setSelectedCellAttr("printable", false);
    } else if (type === "cell-editable") {
      data.setSelectedCellAttr("editable", true);
    } else if (type === "cell-non-editable") {
      data.setSelectedCellAttr("editable", false);
    }
    this.clearClipboard();
    this.sheetReset();
  }

  private toolbarChange(type: ToolBarChangeType | InsertType, value: unknown) {
    const { data } = this;
    if (type === "undo") {
      this.undo();
    } else if (type === "redo") {
      this.redo();
    } else if (type === "print") {
      this.print.preview();
    } else if (type === "paintformat") {
      if (value === true) this.copy();
      else this.clearClipboard();
    } else if (type === "clearformat") {
      this.insertDeleteRowColumn("delete-cell-format");
    } else if (type === "link") {
      // link
    } else if (type === "chart") {
      // chart
    } else if (type === "autofilter") {
      // filter
      this.autofilter();
    } else if (type === "freeze") {
      if (value) {
        const { ri, ci } = data.selector;
        this.freeze(ri, ci);
      } else {
        this.freeze(0, 0);
      }
    } else {
      data.setSelectedCellAttr(type, value);
      if (type === "formula" && !data.selector.multiple()) {
        this.editorSet();
      }
      this.sheetReset();
    }
  }

  private sortFilterChange(
    ci: number,
    order: "asc" | "desc",
    operator: Operator,
    value: string[]
  ) {
    // console.log('sort:', order, operator, value);
    this.data.setAutoFilter(ci, order, operator, value);
    this.sheetReset();
  }

  /**
   * @desc throttle fn
   * @param func function
   * @param wait Delay in milliseconds
   */
  private throttle(func: () => void, wait: number) {
    let timeout: null | NodeJS.Timeout = null;
    return () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func();
        }, wait);
      }
    };
  }

  // private methods
  private overlayerMousemove(evt: MouseEvent) {
    // console.log('x:', evt.offsetX, ', y:', evt.offsetY);
    if (evt.buttons !== 0) return;
    if (evt.target && evt.target.className === `${cssPrefix}-resizer-hover`)
      return;
    const { offsetX, offsetY } = evt;
    const { rowResizer, colResizer, tableEl, data } = this;
    const { rows, cols } = data;
    if (offsetX > cols.indexWidth && offsetY > rows.height) {
      rowResizer.hide();
      colResizer.hide();
      return;
    }
    const tRect = tableEl.box();
    const cRect = data.getCellRectByXY(evt.offsetX, evt.offsetY);
    if (cRect.ri >= 0 && cRect.ci === -1) {
      cRect.width = cols.indexWidth;
      rowResizer.show(cRect, {
        width: tRect.width,
      });
      if (rows.isHide(cRect.ri - 1)) {
        rowResizer.showUnhide(cRect.ri);
      } else {
        rowResizer.hideUnhide();
      }
    } else {
      rowResizer.hide();
    }
    if (cRect.ri === -1 && cRect.ci >= 0) {
      cRect.height = rows.height;
      colResizer.show(cRect, {
        height: tRect.height,
      });
      if (cols.isHide(cRect.ci - 1)) {
        colResizer.showUnhide(cRect.ci);
      } else {
        colResizer.hideUnhide();
      }
    } else {
      colResizer.hide();
    }
  }

  private loopValue(ii: number, vFunc: (i: number) => number) {
    let i = ii;
    let v = 0;
    do {
      v = vFunc(i);
      i += 1;
    } while (v <= 0);
    return v;
  }

  private moveY(vertical: number) {
    const { data, verticalScrollbar } = this;
    const { rows } = data;
    const { top } = verticalScrollbar.scroll();

    if (vertical > 0) {
      // up
      const ri = data.scroll.ri + 1;
      if (ri < rows.len) {
        const rh = this.loopValue(ri, (i) => rows.getHeight(i));
        verticalScrollbar.move({ top: top + rh - 1 });
      }
    } else {
      // down
      const ri = data.scroll.ri - 1;
      if (ri >= 0) {
        const rh = this.loopValue(ri, (i) => rows.getHeight(i));
        verticalScrollbar.move({ top: ri === 0 ? 0 : top - rh });
      }
    }
  }

  // deltaX for Mac horizontal scroll
  private moveX(horizontal: number) {
    const { data, horizontalScrollbar } = this;
    const { cols } = data;
    const { left } = horizontalScrollbar.scroll();

    if (horizontal > 0) {
      // left
      const ci = data.scroll.ci + 1;
      if (ci < cols.len) {
        const cw = this.loopValue(ci, (i) => cols.getWidth(i));
        horizontalScrollbar.move({ left: left + cw - 1 });
      }
    } else {
      // right
      const ci = data.scroll.ci - 1;
      if (ci >= 0) {
        const cw = this.loopValue(ci, (i) => cols.getWidth(i));
        horizontalScrollbar.move({ left: ci === 0 ? 0 : left - cw });
      }
    }
  }

  // let scrollThreshold = 15;
  private overlayerMousescroll(evt: WheelEvent) {
    // deltaY for vertical delta
    const { deltaY, deltaX } = evt;

    // console.log('deltaX', deltaX, 'evt.detail', evt.detail);
    // if (evt.detail) deltaY = evt.detail * 40;

    const tempY = Math.abs(deltaY);
    const tempX = Math.abs(deltaX);
    const temp = Math.max(tempY, tempX);
    // console.log('event:', evt);
    // detail for windows/mac firefox vertical scroll
    if (/Firefox/iu.test(window.navigator.userAgent)) {
      this.throttle(() => {
        this.moveY(evt.detail);
      }, 50)();
      this.throttle(() => {
        this.moveX(evt.detail);
      }, 50)();
    }

    if (temp === tempX)
      this.throttle(() => {
        this.moveX(deltaX);
      }, 50)();
    if (temp === tempY)
      this.throttle(() => {
        this.moveY(deltaY);
      }, 50)();
  }

  private overlayerTouch(direction: Direction, distance: number) {
    const { verticalScrollbar, horizontalScrollbar } = this;
    const { top } = verticalScrollbar.scroll();
    const { left } = horizontalScrollbar.scroll();

    if (direction === "left" || direction === "right") {
      horizontalScrollbar.move({ left: left - distance });
    } else if (direction === "up" || direction === "down") {
      verticalScrollbar.move({ top: top - distance });
    }
  }

  private verticalScrollbarSet() {
    const { data, verticalScrollbar } = this;
    const { height } = this.getTableOffset();
    const erth = data.exceptRowTotalHeight(0, -1);
    // console.log('erth:', erth);
    verticalScrollbar.set(height, data.rows.totalHeight() - erth);
  }

  private horizontalScrollbarSet() {
    const { data, horizontalScrollbar } = this;
    const { width } = this.getTableOffset();
    if (data) {
      horizontalScrollbar.set(width, data.cols.totalWidth());
    }
  }

  private sheetFreeze() {
    const { selector, data, editor } = this;
    const [ri, ci] = data.freeze;
    if (ri > 0 || ci > 0) {
      const fwidth = data.freezeTotalWidth();
      const fheight = data.freezeTotalHeight();
      editor.setFreezeLengths(fwidth, fheight);
    }
    selector.resetAreaOffset();
  }

  private clearClipboard() {
    const { data, selector } = this;
    data.clearClipboard();
    selector.hideClipboard();
  }

  private copy(evt?: ClipboardEvent) {
    const { data, selector } = this;
    if (data.settings.mode === "read") return;
    data.copy();
    if (evt) {
      data.copyToSystemClipboard(evt);
    }
    selector.showClipboard();
  }

  private cut() {
    const { data, selector } = this;
    if (data.settings.mode === "read") return;
    data.cut();
    selector.showClipboard();
  }

  private hideRowsOrCols() {
    this.data.hideRowsOrCols();
    this.sheetReset();
  }

  private unhideRowsOrCols(type: "row" | "col", index: number) {
    this.data.unhideRowsOrCols(type, index);
    this.sheetReset();
  }

  private autofilter() {
    const { data } = this;
    data.autofilter();
    this.sheetReset();
  }

  private toolbarChangePaintformatPaste() {
    const { toolbar } = this;
    if (toolbar.paintformatActive()) {
      this.paste("format");
      this.clearClipboard();
      toolbar.paintformatToggle();
    }
  }

  private editorSetOffset() {
    const { editor, data } = this;
    const sOffset = data.getSelectedRect();
    const tOffset = this.getTableOffset();
    let sPosition = "top";
    // console.log('sOffset:', sOffset, ':', tOffset);
    if (sOffset.top > tOffset.height / 2) {
      sPosition = "bottom";
    }
    if (sOffset.width === undefined || sOffset.height === undefined) {
      throw new Error("Expected sOffset to have width");
    }
    const { left, top, width, height, l, t } = sOffset;
    editor.setOffset({ left, top, width, height, l, t }, sPosition);
  }

  private editorSet() {
    const { editor, data } = this;
    if (data.settings.mode === "read") return;
    this.editorSetOffset();
    editor.setCell(data.getSelectedCell(), data.getSelectedValidator());
    this.clearClipboard();
  }

  private verticalScrollbarMove(distance: number) {
    const { data, table, selector } = this;
    data.scrolly(distance, () => {
      selector.resetBRLAreaOffset();
      this.editorSetOffset();
      table.render();
    });
  }

  private horizontalScrollbarMove(distance: number) {
    const { data, table, selector } = this;
    data.scrollx(distance, () => {
      selector.resetBRTAreaOffset();
      this.editorSetOffset();
      table.render();
    });
  }

  private rowResizerFinished<R extends { ri: number; ci: number }>(
    cRect: R,
    distance: number
  ) {
    const { ri } = cRect;
    const { table, selector, data } = this;
    const { sri, eri } = selector.range;
    if (ri >= sri && ri <= eri) {
      for (let row = sri; row <= eri; row += 1) {
        data.rows.setHeight(row, distance);
      }
    } else {
      data.rows.setHeight(ri, distance);
    }

    table.render();
    selector.resetAreaOffset();
    this.verticalScrollbarSet();
    this.editorSetOffset();
  }

  private colResizerFinished<R extends { ri: number; ci: number }>(
    cRect: R,
    distance: number
  ) {
    const { ci } = cRect;
    const { table, selector, data } = this;
    const { sci, eci } = selector.range;
    if (ci >= sci && ci <= eci) {
      for (let col = sci; col <= eci; col += 1) {
        data.cols.setWidth(col, distance);
      }
    } else {
      data.cols.setWidth(ci, distance);
    }

    table.render();
    selector.resetAreaOffset();
    this.horizontalScrollbarSet();
    this.editorSetOffset();
  }

  private dataSetCellText(text: string, state = "finished") {
    const { data, table } = this;
    // const [ri, ci] = selector.indexes;
    if (data.settings.mode === "read") return;
    data.setSelectedCellText(text, state);
    const { ri, ci } = data.selector;
    if (state === "finished") {
      table.render();
      this.trigger("cell-edited-done", text, ri, ci);
    } else {
      this.trigger("cell-edited", text, ri, ci);
    }
  }

  on(eventName: string, func: Function) {
    this.eventMap.on(eventName, func);
    return this;
  }

  trigger(eventName: string, ...args: unknown[]) {
    const { eventMap } = this;
    eventMap.fire(eventName, args);
  }

  resetData(data: DataProxy) {
    // before
    this.editor.clear();
    // after
    this.data = data;
    this.verticalScrollbarSet();
    this.horizontalScrollbarSet();
    this.toolbar.resetData(data);
    this.print.resetData(data);
    this.selector.resetData(data);
    this.table.resetData(data);
  }

  loadData(data: SheetData) {
    this.data.setData(data);
    this.sheetReset();
    return this;
  }

  // freeze rows or cols
  freeze(ri: number, ci: number) {
    const { data } = this;
    data.setFreeze(ri, ci);
    this.sheetReset();
    return this;
  }

  undo() {
    this.data.undo();
    this.sheetReset();
  }

  redo() {
    this.data.redo();
    this.sheetReset();
  }

  reload() {
    this.sheetReset();
    return this;
  }

  getRect() {
    const { data } = this;
    return { width: data.viewWidth(), height: data.viewHeight() };
  }

  getTableOffset() {
    const { rows, cols } = this.data;
    const { width, height } = this.getRect();
    return {
      width: width - cols.indexWidth,
      height: height - rows.height,
      left: cols.indexWidth,
      top: rows.height,
    };
  }
}

export default Sheet;
