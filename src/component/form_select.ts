import { type Element, h } from "./element";
import Suggest from "./suggest";
import { cssPrefix } from "../config";
import { Formula } from "../core/formula";

export type SelectType = "cell" | "list" | "be";

export default class FormSelect {
  key: string;
  getTitle: (it: unknown) => string;
  vchange: Function;
  itemEl: Element<HTMLDivElement>;
  suggest: Suggest;
  el: Element<HTMLDivElement>;

  //   new FormSelect('cell',
  //   ['cell'], // cell|row|column
  //   '100%',
  //   it => t(`dataValidation.modeType.${it}`)),
  // { required: true },
  // `${t('dataValidation.range')}:`,
  // fieldLabelWidth,

  constructor(
    key: SelectType,
    items: string[],
    width: string,
    getTitle: (it: unknown) => string = (it: unknown) => it as string,
    change: (...arg: string[]) => void = () => {}
  ) {
    this.key = key;
    this.getTitle = getTitle;
    this.vchange = () => {};
    this.el = h("div", `${cssPrefix}-form-select`);
    const f: Formula[] = items.map((i) => ({
      key: i,
      title: () => this.getTitle(i),
      render: () => {},
    }));
    this.suggest = new Suggest(
      f,
      (item: Formula) => {
        this.itemClick(item.key);
        change(item.key);
        this.vchange(item.key);
      },
      width
    );
    this.el
      .children(
        (this.itemEl = h("div", "input-text").html(this.getTitle(key))),
        this.suggest.el
      )
      .on("click", () => {
        this.show();
      });
  }

  show() {
    this.suggest.search("");
  }

  itemClick(it: string) {
    this.key = it;
    this.itemEl.html(this.getTitle(it));
  }

  /** getVal */
  val(): SelectType;
  /** setVal */
  val(v: SelectType): this;
  val(v?: SelectType) {
    if (v !== undefined) {
      this.key = v;
      this.itemEl.html(this.getTitle(v));
      return this;
    }
    return this.key;
  }
}
