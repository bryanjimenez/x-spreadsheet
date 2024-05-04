import { type Element, h } from "./element";
import { cssPrefix } from "../config";
import { t } from "../locale/locale";
import FormInput from "./form_input";
import type FormSelect from "./form_select";
import { type ValidatorType } from "../core/validator";

const patterns = {
  number: /(^\d+$)|(^\d+(\.\d{0,4})?$)/u,
  date: /^\d{4}-\d{1,2}-\d{1,2}$/u,
  // unused, but valid ValidatorType
  list: { test: () => false },
  phone: { test: () => false },
  email: { test: () => false },
};

export interface Rule {
  required: boolean;
  pattern?: RegExp;
  type?: ValidatorType;
}

// rule: { required: false, type, pattern: // }
export default class FormField {
  label: string | Element<HTMLElement>;
  rule: Rule;
  tip: Element<HTMLDivElement>;
  input: FormSelect | FormInput;
  el: Element<HTMLDivElement>;

  constructor(
    input: FormSelect | FormInput,
    rule: Rule,
    label?: string,
    labelWidth?: number
  ) {
    this.label = "";
    this.rule = rule;
    if (label) {
      this.label = h("label", "label")
        .css("width", `${String(labelWidth)}px`)
        .html(label);
    }
    this.tip = h("div", "tip").child("tip").hide();
    this.input = input;
    this.input.vchange = () => this.validate();
    this.el = h("div", `${cssPrefix}-form-field`);
    this.el.children(this.label, input.el, this.tip);
  }

  isShow() {
    return this.el.css("display") !== "none";
  }

  show() {
    this.el.show();
  }

  hide() {
    this.el.hide();
    return this;
  }

  /** getVal */
  val(): string;
  /** setVal */
  val(v: string): Element<HTMLInputElement>;
  val(v?: string) {
    let o
    if (v === undefined) {
      o = this.input.val();
    } else {
      o = this.input.val(v);
    }

    return o;
  }

  hint(hint: string) {
    if (this.input instanceof FormInput) {
      this.input.hint(hint);
    }
  }

  validate() {
    const { input, rule, tip, el } = this;
    const v = input.val();
    if (rule.required) {
      if (/^\s*$/.test(v)) {
        tip.html(t("validation.required"));
        el.addClass("error");
        return false;
      }
    }

    const primary = rule.pattern;
    const secondary = rule.type && patterns[rule.type];
    const pattern = primary ?? secondary;

    if (pattern !== undefined && !pattern.test(v)) {
      tip.html(t("validation.notMatch"));
      el.addClass("error");
      return false;
    }

    el.removeClass("error");
    return true;
  }
}
