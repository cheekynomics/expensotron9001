const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const webpack = require("webpack");
const merge = require("webpack-merge");
const parts = require("./webpack.parts");

const PATHS = {
  src: path.join(__dirname, "src"),
  dist: path.join(__dirname, "dist"),
  templates: path.join(__dirname, "templates"),
  node_modules: path.join(__dirname, "node_modules")
};

const APP_TITLE = process.env.APP_TITLE;

const include = [PATHS.src];
const exclude = [PATHS.node_modules];

process.traceDeprecation = true;

const commonConfig = env =>
  merge([
    {
      node: {
        fs: "empty"
      }
    },
    {
      entry: {
        src: env === "production"
          ? PATHS.src
          : [
              "react-hot-loader/patch",
              require.resolve("react-dev-utils/webpackHotDevClient"),
              PATHS.src
            ]
      },
      output: {
        filename: "bundle.js",
        path: PATHS.dist
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: APP_TITLE,
          template: path.resolve(PATHS.templates, "index-template.ejs")
        })
      ],
      resolve: {
        extensions: [".json", ".js", ".jsx", ".css"]
      },
      devtool: "source-map"
    },
    parts.styleLoaders({
      include,
      exclude
    }),
    parts.googleFonts(["Oswald", "Noto Serif"]),
    parts.fontAwesome,
    parts.imageLoader,
    parts.jsLoaders({
      include,
      exclude
    }),
    parts.gexfCopier({
      include,
      exclude
    }),
    parts.jsonLoader,
    parts.pixiLoader
  ]);

const productionConfig = merge([
  parts.cleanup({ path: PATHS.dist }),
  parts.minifyJS()
]);
const developmentConfig = merge([
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT
  })
]);

module.exports = env => {
  process.env.BABEL_ENV = env;
  let common = commonConfig(env);
  if (env === "production") {
    return merge(common, productionConfig);
  }

  return merge(common, developmentConfig);
};
