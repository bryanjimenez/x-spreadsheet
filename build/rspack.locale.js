import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {
  const localeFiles = fs.readdirSync(path.resolve(__dirname, "src/locale"));
  const entry = {};
  localeFiles.forEach((file) => {
    const name = file.split(".")[0];

    if (name !== "locale") {
      entry[name] = `./src/locale/${file}`;
    }
  });

  return {
    context: __dirname,
    // mode: "development",
    // devtool: "inline-source-map",

    entry,

    resolve: {
      extensions: ["...", ".ts"],
    },

    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist/locale"),
      library: { type: "module" },
    },

    experiments: {
      outputModule: true,
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          loader: path.resolve(__dirname, "locale_loader.js"),
        },
      ],
    },
  };
}
