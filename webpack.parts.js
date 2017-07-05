const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const BabiliPlugin = require("babili-webpack-plugin");
const GoogleFontsPlugin = require("google-fonts-webpack-plugin");
const path = require("path");

/*
 * Conf parts for general process tooling
 */
exports.cleanup = ({ path }) => {
  return {
    plugins: [new CleanWebpackPlugin([path])]
  };
};

exports.devServer = ({ host, port }) => {
  return {
    devServer: {
      historyApiFallback: true,
      stats: "errors-only",
      host, // Defaults to `localhost`
      port, // Defaults to 8080
      hotOnly: true,
      hot: true
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    ]
  };
};

/*
 * Conf parts for javascript
 */
exports.jsLoaders = ({ include, exclude }) => {
  return {
    module: {
      rules: [
        {
          test: /.jsx?$/,
          include,
          exclude,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["es2015", { modules: false }], "react"],
              plugins: ["syntax-dynamic-import"],
              env: {
                development: {
                  plugins: ["react-hot-loader/babel"]
                }
              }
            }
          }
        }
      ]
    }
  };
};

exports.minifyJS = () => ({
  plugins: [new BabiliPlugin()]
});

/*
 * Conf parts for styles
 */
exports.googleFonts = fontFamilies => {
  if (!fontFamilies) {
    return {};
  }
  return {
    plugins: [
      new GoogleFontsPlugin({
        fonts: fontFamilies.map(fontFamily => {
          return { family: fontFamily };
        })
      })
    ]
  };
};

exports.fontAwesome = {
  module: {
    rules: [
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: "url-loader?limit=10000&mimetype=application/font-woff"
      },
      {
        test: /.(ttf|otf|eot|svg?)(\?[a-z0-9]+)?$/,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  }
};

exports.styleLoaders = ({ include, exclude }) => {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          include,
          exclude,
          use: [{ loader: "style-loader" }, { loader: "css-loader" }]
        },
        {
          test: /\.styl$/,
          include,
          exclude,
          use: [
            { loader: "style-loader" },
            { loader: "css-loader" },
            { loader: "stylus-loader" }
          ]
        }
      ]
    }
  };
};

/*
 * Conf parts for static files
 */
exports.gexfCopier = ({ include, exclude }) => {
  return {
    module: {
      rules: [
        {
          test: /\.gexf$/,
          include,
          exclude,
          use: "file-loader"
        }
      ]
    }
  };
};

exports.imageLoader = {
  module: {
    rules: [
      {
        test: /\.(jpg|png)$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 25000
          }
        }
      }
    ]
  }
};

exports.jsonLoader = {
  module: {
    rules: [
      {
        test: /\.json$/,
        use: "json-loader"
      }
    ]
  }
};

exports.pixiLoader = {
  module: {
    rules: [
      {
        enforce: "post",
        include: path.resolve(__dirname, "node_modules/pixi.js"),
        use: "transform?brfs"
      }
    ]
  }
};
