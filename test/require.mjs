import tsNode from "ts-node";

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

