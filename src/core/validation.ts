import Validator, { type OperatorType, type ValidatorType } from "./validator";
import { CellRange } from "./cell_range";
import { SelectType } from "../component/form_select";

class Validation {
  refs: string[];
  mode: SelectType; // cell
  validator: Validator;

  static valueOf({
    refs,
    mode,
    type,
    required,
    operator,
    value,
  }: {
    refs: string[];
    mode: SelectType;
    type: ValidatorType;
    required: boolean;
    value: string;
    operator: OperatorType;
  }) {
    return new Validation(
      mode,
      refs,
      new Validator(type, required, value, operator)
    );
  }

  constructor(mode: SelectType, refs: string[], validator: Validator) {
    this.refs = refs;
    this.mode = mode; // cell
    this.validator = validator;
  }

  includes(ri: number, ci: number) {
    const { refs } = this;
    for (let i = 0; i < refs.length; i += 1) {
      const cr = CellRange.valueOf(refs[i]);
      if (cr.includes(ri, ci)) return true;
    }
    return false;
  }

  addRef(ref: string) {
    this.remove(CellRange.valueOf(ref));
    this.refs.push(ref);
  }

  remove(cellRange: CellRange) {
    const nrefs: string[] = [];
    this.refs.forEach((it) => {
      const cr = CellRange.valueOf(it);
      if (cr.intersects(cellRange)) {
        const crs = cr.difference(cellRange);
        crs.forEach((it1) => nrefs.push(it1.toString()));
      } else {
        nrefs.push(it);
      }
    });
    this.refs = nrefs;
  }

  getData() {
    const { refs, mode, validator } = this;
    const { type, required, operator, value } = validator;
    return {
      refs,
      mode,
      type,
      required,
      operator,
      value,
    };
  }
}
export class Validations {
  _: Validation[];
  errors: Map<string, unknown>;

  constructor() {
    this._ = [];
    // ri_ci: errMessage
    this.errors = new Map();
  }

  getError(ri: number, ci: number) {
    return this.errors.get(`${String(ri)}_${String(ci)}`);
  }

  validate(ri: number, ci: number, text: string) {
    const v = this.get(ri, ci);
    const key = `${String(ri)}_${String(ci)}`;
    const { errors } = this;
    if (v !== null) {
      const [flag, message] = v.validator.validate(text);
      if (!flag) {
        errors.set(key, message);
      } else {
        errors.delete(key);
      }
    } else {
      errors.delete(key);
    }
    return true;
  }

  // type: date|number|phone|email|list
  // validator: { required, value, operator }
  add(
    mode: SelectType,
    ref: string,
    {
      type,
      required,
      value,
      operator,
    }: {
      type: ValidatorType;
      required: boolean;
      value: string;
      operator: OperatorType;
    }
  ) {
    const validator = new Validator(type, required, value, operator);
    const v = this.getByValidator(validator);
    if (v !== null) {
      v.addRef(ref);
    } else {
      this._.push(new Validation(mode, [ref], validator));
    }
  }

  getByValidator(validator: Validator) {
    for (let i = 0; i < this._.length; i += 1) {
      const v = this._[i];
      if (v.validator.equals(validator)) {
        return v;
      }
    }
    return null;
  }

  get(ri: number, ci: number) {
    for (let i = 0; i < this._.length; i += 1) {
      const v = this._[i];
      if (v.includes(ri, ci)) return v;
    }
    return null;
  }

  remove(cellRange: CellRange) {
    this.each((it: Validation) => {
      it.remove(cellRange);
    });
  }

  each(cb: (...arg: any[]) => void) {
    this._.forEach((it) => {
      cb(it);
    });
  }

  getData() {
    return this._.filter((it) => it.refs.length > 0).map((it) => it.getData());
  }

  setData(
    d: {
      refs: string[];
      mode: string;
      type: ValidatorType;
      required: boolean;
      value: string;
      operator: OperatorType;
    }[]
  ) {
    this._ = d.map((it) => Validation.valueOf(it));
  }
}
