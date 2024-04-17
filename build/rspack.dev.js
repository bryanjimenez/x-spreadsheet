import rspack from "@rspack/core";
import path from "node:path";
import { fileURLToPath } from "node:url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));


export default function rspackConfig(
  /** @type string */ _env,
  /** @type string[] */ argv
) {

  return {
    context: __dirname,
    mode: "development",
    devtool: "inline-source-map",

    entry: {
      index: "./src/index.ts",
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
    },

    resolve: {
      extensions: ["...", ".ts"],
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          type: "css",
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: "less-loader",
            },
          ],
          type: "css",
        },
        {
          test: /\.(png|svg|jpe?g|gif)$/i,
          type: "asset/resource",
        },
        {
          test: /\.(js|ts)$/,
          use: [
            {
              loader: "builtin:swc-loader",
              options: {
                sourceMap: true,
                jsc: {
                  parser: {
                    syntax: "typescript",
                  },
                },
                env: {
                  targets: [
                    "chrome >= 87",
                    "edge >= 88",
                    "firefox >= 78",
                    "safari >= 14",
                  ],
                },
              },
            },
          ],
        },
      ],
    },

    plugins: [
      new rspack.HtmlRspackPlugin({
        template: "./index.html",
        title: "x-spreadsheet",
      }),
      new rspack.ProgressPlugin({}),
    ].filter(Boolean),

    devServer: {
      host: "localhost",
      port: 3000,
      static: "../dist",
    }
  }
}
