import { type CellRef } from "./cell_range";

// eslint-disable-next-line
const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

/** index number 2 letters
 * @example stringAt(26) ==> 'AA'
 * @date 2019-10-10
 */
export function stringAt(index: number) {
  let str = "";
  let cindex = index;
  while (cindex >= alphabets.length) {
    cindex /= alphabets.length;
    cindex -= 1;
    str += alphabets[Math.trunc(cindex) % alphabets.length];
  }
  const last = index % alphabets.length;
  str += alphabets[last];
  return str;
}

/** translate letter in A1-tag to number
 * @date 2019-10-10
 * @param {string} str "AA" in A1-tag "AA1"
 */
export function indexAt(str: string) {
  let ret = 0;
  for (let i = 0; i !== str.length; i += 1)
    ret = 26 * ret + str.charCodeAt(i) - 64;
  return ret - 1;
}

/** translate A1-tag to XY-tag
 * @date 2019-10-10
 * @example B10 => x,y
 */
export function expr2xy(src: CellRef): [number, number] {
  let x = "";
  let y = "";
  for (let i = 0; i < src.length; i += 1) {
    if (src.charAt(i) >= "0" && src.charAt(i) <= "9") {
      y += src.charAt(i);
    } else {
      x += src.charAt(i);
    }
  }
  return [indexAt(x), parseInt(y, 10) - 1];
}

/** translate XY-tag to A1-tag
 * @example x,y => B10
 * @date 2019-10-10
 */
export function xy2expr(x: number, y: number): CellRef {
  return `${stringAt(x)}${String(y + 1)}`;
}

/** translate A1-tag src by (xn, yn)
 * @date 2019-10-10
 */
export function expr2expr(
  src: string,
  xn: number,
  yn: number,
  condition: (x: number, y: number) => boolean = () => true
) {
  if (xn === 0 && yn === 0) return src;
  const [x, y] = expr2xy(src);
  if (!condition(x, y)) return src;
  return xy2expr(x + xn, y + yn);
}

export default {
  stringAt,
  indexAt,
  expr2xy,
  xy2expr,
  expr2expr,
};
