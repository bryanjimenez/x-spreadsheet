import { tf } from "../locale/locale";

const formatStringRender = (v: string) => v;

const formatNumberRender = (v: string) => {
  // match "-12.1" or "12" or "12.1"
  if (/^(?:-?\d*.?\d*)$/u.test(v)) {
    const v1 = Number(v).toFixed(2).toString();
    const [first, ...parts] = v1.split("\\.");
    return [first.replace(/(\d)(?=(\d{3})+(?!\d))/gu, "$1,"), ...parts];
  }
  return v;
};

interface BaseFormats {
  key: string;
  title: () => string;
  label?: string;
  type: "string" | "number" | "date";
  render: (arg: any) => string;
}

export const baseFormats: BaseFormats[] = [
  {
    key: "normal",
    title: tf("format.normal"),
    type: "string",
    render: formatStringRender,
  },
  {
    key: "text",
    title: tf("format.text"),
    type: "string",
    render: formatStringRender,
  },
  {
    key: "number",
    title: tf("format.number"),
    type: "number",
    label: "1,000.12",
    render: formatNumberRender,
  },
  {
    key: "percent",
    title: tf("format.percent"),
    type: "number",
    label: "10.12%",
    render: (v: string) => `${v}%`,
  },
  {
    key: "rmb",
    title: tf("format.rmb"),
    type: "number",
    label: "￥10.00",
    render: (v: string) => `￥${formatNumberRender(v)}`,
  },
  {
    key: "usd",
    title: tf("format.usd"),
    type: "number",
    label: "$10.00",
    render: (v: string) => `$${formatNumberRender(v)}`,
  },
  {
    key: "eur",
    title: tf("format.eur"),
    type: "number",
    label: "€10.00",
    render: (v: string) => `€${formatNumberRender(v)}`,
  },
  {
    key: "date",
    title: tf("format.date"),
    type: "date",
    label: "26/09/2008",
    render: formatStringRender,
  },
  {
    key: "time",
    title: tf("format.time"),
    type: "date",
    label: "15:59:00",
    render: formatStringRender,
  },
  {
    key: "datetime",
    title: tf("format.datetime"),
    type: "date",
    label: "26/09/2008 15:59:00",
    render: formatStringRender,
  },
  {
    key: "duration",
    title: tf("format.duration"),
    type: "date",
    label: "24:01:00",
    render: formatStringRender,
  },
];

export const formatm = baseFormats.reduce<Record<string, BaseFormats>>(
  (acc, f) => ({ ...acc, [f.key]: f }),
  {}
);
