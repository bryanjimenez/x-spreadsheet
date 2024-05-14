import Modal from "./modal";
import FormInput from "./form_input";
import FormSelect, { type SelectType } from "./form_select";
import FormField, { type Rule } from "./form_field";
import Button from "./button";
import { t } from "../locale/locale";
import { h } from "./element";
import { cssPrefix } from "../config";
import { Validator, type OperatorType, ValidatorType } from "../core/validator";
import { type CellRef } from "../core/cell_range";

const fieldLabelWidth = 100;

export default class ModalValidation extends Modal {
  mf: FormField;
  rf: FormField;
  cf: FormField;
  of: FormField;
  minvf: FormField;
  maxvf: FormField;
  vf: FormField;
  svf: FormField;
  change: (arg: string, mode?: SelectType, ref?: CellRef, rule?: Rule) => void;

  constructor() {
    const mf = new FormField(
      new FormSelect(
        "cell",
        ["cell"], // cell|row|column
        "100%",
        (it) => t(`dataValidation.modeType.${it}`)
      ),
      { required: true },
      `${t("dataValidation.range")}:`,
      fieldLabelWidth
    );
    const rf = new FormField(new FormInput("120px", "E3 or E3:F12"), {
      required: true,
      pattern: /^([A-Z]{1,2}[1-9]\d*)(:[A-Z]{1,2}[1-9]\d*)?$/u,
    });
    const cf = new FormField(
      new FormSelect(
        "list",
        ["list", "number", "date", "phone", "email"],
        "100%",
        (it) => t(`dataValidation.type.${it}`),
        (it) => {
          this.criteriaSelected(it);
        }
      ),
      { required: true },
      `${t("dataValidation.criteria")}:`,
      fieldLabelWidth
    );

    // operator
    const of = new FormField(
      new FormSelect(
        "be",
        ["be", "nbe", "eq", "neq", "lt", "lte", "gt", "gte"],
        "160px",
        (it) => t(`dataValidation.operator.${it}`),
        (it) => {
          this.criteriaOperatorSelected(it);
        }
      ),
      { required: true }
    ).hide();
    // min, max
    const minvf = new FormField(new FormInput("70px", "10"), {
      required: true,
    }).hide();
    const maxvf = new FormField(new FormInput("70px", "100"), {
      required: true,
      type: "number",
    }).hide();
    // value
    const svf = new FormField(new FormInput("120px", "a,b,c"), {
      required: true,
    });
    const vf = new FormField(new FormInput("70px", "10"), {
      required: true,
      type: "number",
    }).hide();

    const a = h("div", `${cssPrefix}-form-fields`);
    a.children(mf.el, rf.el);
    const b = h("div", `${cssPrefix}-form-fields`);
    b.children(cf.el, of.el, minvf.el, maxvf.el, vf.el, svf.el);

    const c = h("div", `${cssPrefix}-buttons`);
    c.children(
      new Button("cancel").on("click", () => {
        this.btnClick("cancel");
      }),
      new Button("remove").on("click", () => {
        this.btnClick("remove");
      }),
      new Button("save", "primary").on("click", () => {
        this.btnClick("save");
      })
    );

    super(t("contextmenu.validation"), [a, b, c]);
    this.mf = mf;
    this.rf = rf;
    this.cf = cf;
    this.of = of;
    this.minvf = minvf;
    this.maxvf = maxvf;
    this.vf = vf;
    this.svf = svf;
    this.change = () => {};
  }

  showVf(it: ValidatorType) {
    const hint = it === "date" ? "2018-11-12" : "10";
    const { vf } = this;
    if (vf.input instanceof FormInput) {
      vf.input.hint(hint);
    }
    vf.show();
  }

  criteriaSelected(it: ValidatorType) {
    const { of, minvf, maxvf, vf, svf } = this;
    if (it === "date" || it === "number") {
      of.show();
      minvf.rule.type = it;
      maxvf.rule.type = it;
      if (it === "date") {
        minvf.hint("2018-11-12");
        maxvf.hint("2019-11-12");
      } else {
        minvf.hint("10");
        maxvf.hint("100");
      }
      minvf.show();
      maxvf.show();
      vf.hide();
      svf.hide();
    } else {
      if (it === "list") {
        svf.show();
      } else {
        svf.hide();
      }
      vf.hide();
      of.hide();
      minvf.hide();
      maxvf.hide();
    }
  }

  criteriaOperatorSelected(it?: OperatorType) {
    if (!it) return;
    const { minvf, maxvf, vf } = this;
    if (it === "be" || it === "nbe") {
      minvf.show();
      maxvf.show();
      vf.hide();
    } else {
      const type = this.cf.val() as ValidatorType;
      vf.rule.type = type;
      if (type === "date") {
        vf.hint("2018-11-12");
      } else {
        vf.hint("10");
      }
      vf.show();
      minvf.hide();
      maxvf.hide();
    }
  }

  btnClick(action: "cancel" | "remove" | "save") {
    if (action === "cancel") {
      this.hide();
    } else if (action === "remove") {
      this.change("remove");
      this.hide();
    } else if (action === "save") {
      // validate
      const attrs = ["mf", "rf", "cf", "of", "svf", "vf", "minvf", "maxvf"];
      for (let i = 0; i < attrs.length; i += 1) {
        const field = this[attrs[i]];
        // console.log('field:', field);
        if (field.isShow()) {
          // console.log('it:', it);
          if (!field.validate()) return;
        }
      }

      const mode = this.mf.val();
      const ref = this.rf.val();
      const type: ValidatorType = this.cf.val();
      const operator = this.of.val();
      let value = this.svf.val();
      if (type === "number" || type === "date") {
        if (operator === "be" || operator === "nbe") {
          value = [this.minvf.val(), this.maxvf.val()];
        } else {
          value = this.vf.val();
        }
      }
      // console.log(mode, ref, type, operator, value);
      this.change("save", mode, ref, {
        type,
        operator,
        required: false,
        value,
      });
      this.hide();
    }
  }

  setValue(v: { mode?: SelectType; ref: CellRef; validator?: Validator }) {
    if (v) {
      const { mf, rf, cf, of, svf, vf, minvf, maxvf } = this;
      const { mode, ref, validator } = v;
      const { type, operator, value } = validator || { type: "list" };
      mf.val(mode || "cell");
      rf.val(ref);
      cf.val(type);
      of.val(operator);
      if (Array.isArray(value)) {
        minvf.val(value[0]);
        maxvf.val(value[1]);
      } else {
        svf.val(value || "");
        vf.val(value || "");
      }
      this.criteriaSelected(type);
      this.criteriaOperatorSelected(operator);
    }
    this.show();
  }
}
