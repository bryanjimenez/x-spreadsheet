/* global window */
export const cssPrefix = "x-spreadsheet";
export const dpr = typeof window!=="undefined"? window.devicePixelRatio : 1;
export default {
  cssPrefix,
  dpr,
};
