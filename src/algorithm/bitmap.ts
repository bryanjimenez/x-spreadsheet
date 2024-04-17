/* eslint no-bitwise: "off" */
/**
 *
 * @param v value
 * @param digit bit len of v
 * @param flag
 */
const bitmap = (v: number, digit: number, flag: boolean) => {
  const b = 1 << digit;
  return flag ? v | b : v ^ b;
};
export default bitmap;
