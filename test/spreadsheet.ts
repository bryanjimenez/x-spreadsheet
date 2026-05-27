import "jsdom-global/register";
import assert from "assert";
import { describe, it } from "mocha";
import { Spreadsheet } from "../src/index";

describe("./src/spreasheet", function () {
  it("exportValues", () => {

    const data = {
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

    const myDiv = window.document.createElement("div");
    const sheet = new Spreadsheet(myDiv, {}).loadData([data]);
    const [actual] = sheet.exportValues();

    assert.equal(actual.name, data.name);
  });
});
