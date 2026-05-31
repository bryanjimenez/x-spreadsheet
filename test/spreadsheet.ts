import "jsdom-global/register";
import assert from "assert";
import { describe, it } from "mocha";
import { Spreadsheet } from "../src/index";
import zhCn from "../src/locale/zh-cn.json";

/** Deep Immutable `T` */
export type Immutable<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
};

function deepCopy<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function deepFreeze<T>(obj: T): Immutable<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as any)[name];
    if (value !== undefined && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

describe("./src/spreasheet", function () {
  const dataA = {
    name: "SheetA",
    autofilter: {
      ref: null,
      filters: [],
      sort: null,
    },
    rows: {
      "0": {
        cells: {
          "0": { text: "header 1" },
          "1": { text: "header 2" },
          "2": { text: "header 3" },
        },
      },
      "1": {
        cells: {
          "0": { text: "a" },
          "1": { text: "b" },
          "2": { text: "c" },
        },
      },
      len: 2,
    },
  };

  const dataB = {
    name: "SheetB",
    autofilter: {
      ref: null,
      filters: [],
      sort: null,
    },
    rows: {
      "0": {
        cells: {
          "0": { text: "header 100" },
          "1": { text: "header 101" },
          "2": { text: "header 102" },
        },
      },
      "1": {
        cells: {
          "0": { text: "X" },
          "1": { text: "Y" },
          "2": { text: "Z" },
        },
      },
      len: 2,
    },
  };

  describe("Spreadsheet", function () {
    describe("data", function () {
      it.skip("loadData doesn't mutate", function () {
        // NOTE: the dataCopy.row.len property is being modified by loadData

        const dataCopy = deepFreeze(dataA);

        const myDiv = window.document.createElement("div");
        let sheet;
        try {
          // @ts-expect-error dataCopy is not unwrapped
          sheet = new Spreadsheet(myDiv, {}).loadData([dataCopy]);
        } catch (err) {
          assert.fail(err);
        }
        const [actual] = sheet.exportValues();

        assert.equal(actual.name, dataA.name);
        // assert.equal(actual.rows.len, data.rows.len)
        assert.equal(actual.rows.len, Object.keys(dataA.rows).length);
      });

      it("exportValues: no change", function () {
        const dataCopy = deepCopy(dataA);

        const myDiv = window.document.createElement("div");
        const sheet = new Spreadsheet(myDiv).loadData([dataCopy]);
        const [actual] = sheet.exportValues();

        assert.equal(actual.name, dataA.name);
        assert.equal(actual.rows.len, dataA.rows.len);
        // assert.equal(actual.rows.len, Object.keys(data.rows).length)
      });

      it("exportValues: w/ change", function () {
        const dataCopy = deepCopy(dataA);

        const myDiv = window.document.createElement("div");
        const sheet = new Spreadsheet(myDiv).loadData([dataCopy]);
        sheet.cellText(1, 0, "Z");
        sheet.cellText(1, 1, "Z");
        sheet.cellText(1, 2, "Z");
        const [actual] = sheet.exportValues();

        assert.equal(actual.name, dataA.name);
        assert.equal(actual.rows.len, dataA.rows.len);
        assert.equal(
          JSON.stringify(actual.rows[1].cells),
          JSON.stringify({
            "0": {
              text: "Z",
            },
            "1": {
              text: "Z",
            },
            "2": {
              text: "Z",
            },
          })
        );
      });

      it("focusOnSheet", function () {
        const dataCopy = deepCopy([dataA, dataB]);

        const myDiv = window.document.createElement("div");
        const sheet = new Spreadsheet(myDiv).loadData(dataCopy);
        sheet.focusOnSheet("SheetB");
        sheet.cellText(1, 0, "Z");
        sheet.cellText(1, 1, "Z");
        sheet.cellText(1, 2, "Z");
        const [_sheetA, actual] = sheet.exportValues();

        assert.equal(actual.name, dataB.name);
        assert.equal(actual.rows.len, dataB.rows.len);
        assert.equal(
          JSON.stringify(actual.rows[1].cells),
          JSON.stringify({
            "0": {
              text: "X",
            },
            "1": {
              text: "Y",
            },
            "2": {
              text: "Z",
            },
          })
        );
      });
    });

    describe("html", function () {
      it("hide toolbar", function () {
        const expected = false;
        const myDiv = window.document.createElement("div");
        const sheet = new Spreadsheet(myDiv, {
          toolbar: { show: expected },
        }).loadData([]);
        // const [actual] = sheet.exportValues();

        assert.equal(myDiv.getElementsByClassName("x-spreadsheet").length, 1);

        assert.equal(
          sheet.data.settings.toolbar.show,
          expected,
          "toolbar-settings"
        );
        assert.equal(!sheet.sheet.toolbar.isHide, expected, "toolbar-object");
        assert.equal(
          myDiv
            .getElementsByClassName("x-spreadsheet-toolbar")[0]
            .getAttribute("style"),
          "display: none;",
          "toolbar-html"
        );

        assert.equal(
          myDiv.getElementsByClassName("x-spreadsheet-bottombar").length,
          1
        );
      });
    });
  });

  describe("Spreadsheet.locale", function () {
    it("[UNFINISHED] zh-cn", function () {
      const expected = false;
      const myDiv = window.document.createElement("div");

      Spreadsheet.locale("zh-cn", zhCn);
      const _sheet = new Spreadsheet(myDiv, {
        toolbar: { show: expected },
      }).loadData([]);
      // const [actual] = sheet.exportValues();

      const toolbarBtns = myDiv.getElementsByClassName(
        "x-spreadsheet-toolbar-btn"
      );

      assert.equal(
        toolbarBtns[0].getAttribute("data-tooltip"),
        `${zhCn.toolbar.undo} (Ctrl+Z)`,
        "Undo"
      );

      assert.equal(
        toolbarBtns[1].getAttribute("data-tooltip"),
        `${zhCn.toolbar.redo} (Ctrl+Y)`,
        "Redo"
      );

      assert.equal(
        toolbarBtns[2].getAttribute("data-tooltip"),
        `${zhCn.toolbar.print} (Ctrl+P)`,
        "Print"
      );

      assert.equal(
        toolbarBtns[3].getAttribute("data-tooltip"),
        zhCn.toolbar.paintformat,
        "Printformat"
      );

      assert.equal(
        toolbarBtns[4].getAttribute("data-tooltip"),
        zhCn.toolbar.clearformat,
        "Clearformat"
      );

      // assert.equal(
      //   toolbarBtns[5]
      //     .getAttribute("data-tooltip"),
      //   `${zhCn.toolbar.clearformat}`,
      //   "Clearformat"
      // );

      // assert.equal(
      //   toolbarBtns[6]
      //     .getAttribute("data-tooltip"),
      //   `${zhCn.toolbar.format}`,
      //   "Format"
      // );

      // assert.equal(
      //   toolbarBtns[8]
      //     .getAttribute("data-tooltip"),
      //   `${zhCn.toolbar.fontName}`,
      //   "Font Name"
      // );

      assert.equal(
        toolbarBtns[8].getAttribute("data-tooltip"),
        `${zhCn.toolbar.fontBold} (Ctrl+B)`,
        "Bold"
      );

      assert.equal(
        toolbarBtns[9].getAttribute("data-tooltip"),
        `${zhCn.toolbar.fontItalic} (Ctrl+I)`,
        "Italic"
      );

      assert.equal(
        toolbarBtns[10].getAttribute("data-tooltip"),
        `${zhCn.toolbar.underline} (Ctrl+U)`,
        "Underline"
      );

      assert.equal(
        toolbarBtns[11].getAttribute("data-tooltip"),
        `${zhCn.toolbar.strike} (Ctrl+U)`,
        "Strike"
      );

      assert.equal(
        toolbarBtns[12].getAttribute("data-tooltip"),
        zhCn.toolbar.color,
        "color"
      );

      assert.equal(
        toolbarBtns[13].getAttribute("data-tooltip"),
        zhCn.toolbar.bgcolor,
        "bgcolor"
      );

      assert.equal(
        toolbarBtns[14].getAttribute("data-tooltip"),
        zhCn.toolbar.border,
        "border"
      );

      // assert.equal(
      //   toolbarBtns[15]
      //     .getAttribute("data-tooltip"),
      //   `${zhCn.toolbar.merge}`,
      //   "??"
      // );

      // assert.equal(
      //   toolbarBtns[16]
      //     .getAttribute("data-tooltip"),
      //   `${zhCn.toolbar.align}`,
      //   "??"
      // );

      assert.equal(
        toolbarBtns[17].getAttribute("data-tooltip"),
        zhCn.toolbar.merge,
        "merge"
      );

      assert.equal(
        toolbarBtns[18].getAttribute("data-tooltip"),
        zhCn.toolbar.align,
        "align"
      );

      assert.equal(
        toolbarBtns[19].getAttribute("data-tooltip"),
        zhCn.toolbar.valign,
        "valign"
      );

      assert.equal(
        toolbarBtns[20].getAttribute("data-tooltip"),
        zhCn.toolbar.textwrap,
        "textwrap"
      );

      assert.equal(
        toolbarBtns[21].getAttribute("data-tooltip"),
        zhCn.toolbar.freeze,
        "freeze"
      );

      assert.equal(
        toolbarBtns[22].getAttribute("data-tooltip"),
        zhCn.toolbar.autofilter,
        "autofilter"
      );

      assert.equal(
        toolbarBtns[23].getAttribute("data-tooltip"),
        zhCn.toolbar.formula,
        "formula"
      );

      assert.equal(
        toolbarBtns[24].getAttribute("data-tooltip"),
        zhCn.toolbar.more,
        "more"
      );

      // Array.from(
      //   myDiv.getElementsByClassName("x-spreadsheet-toolbar-btn")
      // ).forEach((el) => {
      //   console.log(el.innerHTML);
      //   console.log(el.getAttribute("data-tooltip"));
      // });
    });
  });
});
