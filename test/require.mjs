import tsNode from "ts-node";
import Module from "node:module";

tsNode.register({
  esm: true,

  // project: "./tsconfig.json",

  // disregard typescript errors before transpilation
  transpileOnly: true,

  compilerOptions: {
    moduleResolution: "node",
  },

  //override package.json *type: module* setting
  moduleTypes: {
    "./test/**/*.ts": "cjs",
    "./src/**/*.ts": "cjs",
  },
});

// @ts-expect-error private method
const orig = Module._extensions[".js"];

// @ts-expect-error private method
Module._extensions[".js"] = function (
  /** @type {unknown} */ module,
  /** @type {string} */ filename
) {
  if (filename.endsWith(".css") || filename.endsWith(".less")) {
    /**
     * From: https://github.com/TypeStrong/ts-node/issues/175
     * We are going to ignore css files
     */
    return;
  }
  return orig(module, filename);
};
