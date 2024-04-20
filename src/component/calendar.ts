import { type Element, h } from "./element";
import Icon from "./icon";
import { ct, t } from "../locale/locale";

function addMonth(date: Date, step: number) {
  date.setMonth(date.getMonth() + step);
}

function weekday(date: Date, index: number) {
  const d = new Date(date);
  d.setDate(index - date.getDay() + 1);
  return d;
}

type DtObj = { d: Date; disabled: boolean; active: boolean };
function monthDays(year: number, month: number, cdate: Date) {
  // the first day of month
  const startDate = new Date(year, month, 1, 23, 59, 59);
  // eslint-disable-next-line
  const datess:[DtObj[],DtObj[],DtObj[],DtObj[],DtObj[],DtObj[]] = [[], [], [], [], [], []];
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 7; j += 1) {
      const index = i * 7 + j;
      const d = weekday(startDate, index);
      const disabled = d.getMonth() !== month;
      // console.log('d:', d, ', cdate:', cdate);
      const active =
        d.getMonth() === cdate.getMonth() && d.getDate() === cdate.getDate();
      datess[i][j] = { d, disabled, active };
    }
  }
  return datess;
}

export default class Calendar {
  value: Date;
  cvalue: Date;

  headerLeftEl: Element<HTMLDivElement>;
  bodyEl: Element<HTMLTableElement>;
  selectChange: Function;
  el: Element<HTMLDivElement>;

  constructor(value: Date) {
    this.value = value;
    this.cvalue = new Date(value);

    this.headerLeftEl = h("div", "calendar-header-left");
    this.bodyEl = h("tbody", "");
    this.buildAll();
    this.el = h("div", "x-spreadsheet-calendar");
    this.el.children(
      h("div", "calendar-header").children(
        this.headerLeftEl,
        h("div", "calendar-header-right").children(
          h("a", "calendar-prev")
            .on("click.stop", () => {
              this.prev();
            })
            .child(new Icon("chevron-left")),
          h("a", "calendar-next")
            .on("click.stop", () => {
              this.next();
            })
            .child(new Icon("chevron-right"))
        )
      ),
      h("table", "calendar-body").children(
        h("thead", "").child(
          h("tr", "").children(
            ...ct("calendar.weeks").map((week) => h("th", "cell").child(week))
          )
        ),
        this.bodyEl
      )
    );
    this.selectChange = () => {};
  }

  setValue(value: Date) {
    this.value = value;
    this.cvalue = new Date(value);
    this.buildAll();
  }

  prev() {
    const { value } = this;
    addMonth(value, -1);
    this.buildAll();
  }

  next() {
    const { value } = this;
    addMonth(value, 1);
    this.buildAll();
  }

  buildAll() {
    this.buildHeaderLeft();
    this.buildBody();
  }

  buildHeaderLeft() {
    const { value } = this;
    this.headerLeftEl.html(
      `${ct("calendar.months")[value.getMonth()]} ${value.getFullYear()}`
    );
  }

  buildBody() {
    const { value, cvalue, bodyEl } = this;
    const mDays = monthDays(value.getFullYear(), value.getMonth(), cvalue);
    const trs = mDays.map((it) => {
      const tds = it.map((it1) => {
        let cls = "cell";
        if (it1.disabled) cls += " disabled";
        if (it1.active) cls += " active";
        return h("td", "").child(
          h("div", cls)
            .on("click.stop", () => {
              this.selectChange(it1.d);
            })
            .child(it1.d.getDate().toString())
        );
      });
      return h("tr", "").children(...tds);
    });
    bodyEl.html("").children(...trs);
  }
}
