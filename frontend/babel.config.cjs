module.exports = {
  presets: [
    ["@babel/preset-typescript", { allowDeclareFields: true }],
    ["@babel/preset-react", { runtime: "automatic" }]
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { legacy: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }]
  ],
};
