import { type SheetData } from "../src/index.ts";
import type AutoFilter from "../src/core/auto_filter.ts";
import { CellRange } from "../src/core/cell_range.ts";
import { stringAt } from "../src/helper.ts";

/** Deep Immutable `T` */
export type Immutable<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
};

export function deepCopy<T>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function deepFreeze<T>(obj: T): Immutable<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as any)[name];
    if (value !== undefined && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

export function tableyfi(sheet: SheetData, console?: boolean) {
  const data = sheet.rows;
  if (data === undefined) {
    return {};
  }

  return Object.keys(data).reduce((acc, rowIdx) => {
    const currRow = data[rowIdx];
    if (currRow === undefined) {
      return acc;
    }
    if (rowIdx === "len") {
      return acc;
    }

    const row = Object.keys(currRow.cells).reduce((col, colIdx) => {
      return {
        ...col,
        [console ? stringAt(parseInt(colIdx, 10)) : colIdx]:
          currRow.cells[colIdx]?.text,
      };
    }, {});

    return { ...acc, [console ? parseInt(rowIdx, 10) + 1 : rowIdx]: row };
  }, {});
}

export function swapify(
  sheet: SheetData,
  filter: AutoFilter,
  swapMap: Map<number, number>,
) {
  const data = sheet.rows;
  if (data === undefined) {
    throw new Error("Undefined data");
  }
  if (filter.ref === null) {
    throw new Error("Undefined filter");
  }

  const { sri, sci, eri, eci } = CellRange.valueOf(filter.ref);

  const sortedSheet = deepCopy(sheet);

  for (let r = sri; r <= eri; r++) {
    for (let c = sci; c <= eci; c++) {
      if (r === 0) {
        // header column not sorted
        // outside sort range not sorted
        break;
      }

      const swapRow = swapMap.get(r);
      if (swapRow === undefined) {
        throw new Error(`Expected to find a swap for ${r}`);
      }

      if (data[swapRow] === undefined) {
        continue;
      }

      if (data[swapRow].cells[c] === undefined) {
        delete sortedSheet.rows[r].cells[c];
        continue;
      }

      if (sortedSheet.rows[r] === undefined) {
        sortedSheet.rows = {
          ...sortedSheet.rows,
          [r]: { cells: { [c]: data[swapRow].cells[c] } },
        };
      }

      sortedSheet.rows[r].cells[c] = data[swapRow].cells[c];
    }
  }

  delete sortedSheet.autofilter;
  return sortedSheet;
}

/**
 * The **`HTMLCanvasElement.getContext()`** method returns a drawing context on the canvas, or null if the context identifier is not supported, or the canvas has already been set to a different context mode.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext)
 */
function getContextMock(
    _contextId: string,
    _options?: CanvasRenderingContext2DSettings,
):CanvasRenderingContext2D {
// getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
// getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null;
// getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null;
// getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;
// getContext(contextId: string, options?: any): RenderingContext | null;

  return {
      scale: () => {},
      clearRect: () => {},
      save: () => {},
      beginPath: () => {},
      translate: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      restore: () => {},
      fillRect: () => {},
      fillText: () => {},
      rect: () => {},
      clip: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
    };
}

export function mockCanvasAPI() {

  // @ts-expect-error mocking the getContext method
  HTMLCanvasElement.prototype.getContext = getContextMock
}
