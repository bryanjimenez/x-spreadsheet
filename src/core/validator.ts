import { t } from "../locale/locale";
import { arrayEquals } from "./helper";

const rules = {
  phone: /^[1-9]\d{10}$/u,
  email: /w+(?:[-+.]w+)*@w+(?:[-.]w+)*.w+(?:[-.]w+)*/u,
  // not implemented return false match
  date: { test: () => false },
  number: { test: () => false },
  list: { test: () => false },
};

function returnMessage(
  flag: boolean,
  key: string,
  ..._arg: string[]
): [boolean, string] {
  let message = "";
  if (!flag) {
    // TODO: add extra context info into message
    // message = t(`validation.${key}`, ...arg);
    message = t(`validation.${key}`);
  }
  return [flag, message];
}

export type ValidatorType = "date" | "number" | "list" | "phone" | "email";
export type OperatorType =
  | "b"
  | "nb"
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "be"
  | "nbe";

export class Validator {
  required: boolean;
  value: string;
  type: ValidatorType;
  operator: OperatorType;
  message: string;

  constructor(
    type: ValidatorType,
    required: boolean,
    value: string,
    operator: OperatorType
  ) {
    this.required = required;
    this.value = value;
    this.type = type;
    this.operator = operator;
    this.message = "";
  }

  parseValue(v: string) {
    const { type } = this;
    if (type === "date") {
      return new Date(v);
    }
    if (type === "number") {
      return Number(v);
    }
    return v;
  }

  equals(other: Validator) {
    let flag =
      this.type === other.type &&
      this.required === other.required &&
      this.operator === other.operator;
    if (flag) {
      if (Array.isArray(this.value) && Array.isArray(other.value)) {
        flag = arrayEquals(this.value, other.value);
      } else {
        flag = this.value === other.value;
      }
    }
    return flag;
  }

  values() {
    return this.value.split(",");
  }

  validate(v: string) {
    const { required, operator, value, type } = this;
    if (required && /^\s*$/u.test(v)) {
      return returnMessage(false, "required");
    }
    if (/^\s*$/u.test(v)) return [true];
    if (rules[type] && !rules[type].test(v)) {
      return returnMessage(false, "notMatch");
    }
    if (type === "list") {
      return returnMessage(this.values().includes(v), "notIn");
    }
    if (operator) {
      const v1 = this.parseValue(v);
      if (operator === "be") {
        const [min, max] = value;
        return returnMessage(
          v1 >= this.parseValue(min) && v1 <= this.parseValue(max),
          "between",
          min,
          max
        );
      }
      if (operator === "nbe") {
        const [min, max] = value;
        return returnMessage(
          v1 < this.parseValue(min) || v1 > this.parseValue(max),
          "notBetween",
          min,
          max
        );
      }
      if (operator === "eq") {
        return returnMessage(v1 === this.parseValue(value), "equal", value);
      }
      if (operator === "neq") {
        return returnMessage(v1 !== this.parseValue(value), "notEqual", value);
      }
      if (operator === "lt") {
        return returnMessage(v1 < this.parseValue(value), "lessThan", value);
      }
      if (operator === "lte") {
        return returnMessage(
          v1 <= this.parseValue(value),
          "lessThanEqual",
          value
        );
      }
      if (operator === "gt") {
        return returnMessage(v1 > this.parseValue(value), "greaterThan", value);
      }
      if (operator === "gte") {
        return returnMessage(
          v1 >= this.parseValue(value),
          "greaterThanEqual",
          value
        );
      }
    }
    return [true];
  }
}
