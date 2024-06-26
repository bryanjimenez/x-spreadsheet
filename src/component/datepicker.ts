import Calendar from "./calendar";
import { type Element, h } from "./element";
import { cssPrefix } from "../config";

export default class Datepicker {
  calendar: Calendar;
  el: Element<HTMLDivElement>;

  constructor() {
    this.calendar = new Calendar(new Date());
    this.el = h("div", `${cssPrefix}-datepicker`)
      .child(this.calendar.el)
      .hide();
  }

  setValue(date: Date | string) {
    // console.log(':::::::', date, typeof date, date instanceof string);
    const { calendar } = this;
    if (typeof date === "string") {
      // console.log(/^\d{4}-\d{1,2}-\d{1,2}$/.test(date));
      if (/^\d{4}-\d{1,2}-\d{1,2}$/u.test(date)) {
        calendar.setValue(new Date(date.replace(/-/gu, "/")));
      }
    } else if (date instanceof Date) {
      calendar.setValue(date);
    }
    return this;
  }

  change(cbFn: (d: Date) => void) {
    this.calendar.selectChange = (d: Date) => {
      cbFn(d);
      this.hide();
    };
  }

  show() {
    this.el.show();
  }

  hide() {
    this.el.hide();
  }
}
