const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const BabiliPlugin = require("babili-webpack-plugin");
// const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
// const cssnano = require("cssnano");
const path = require("path");

/*
 * Conf parts for general process tooling
 */
exports.cleanup = (
  {
    path
  }
) => {
  return {
    plugins: [new CleanWebpackPlugin([path])]
  };
};

exports.devServer = (
  {
    host,
    port
  }
) => {
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
exports.jsLoaders = (
  {
    include,
    exclude
  }
) => {
  return {
    module: {
      rules: [
        {
          test: /.jsx?$/,
          include,
          exclude,
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
exports.styleLoaders = (
  {
    include,
    exclude
  }
) => {
  return {
    module: {
      rules: [
        {
          test: /.css$/,
          include,
          exclude,
          loader: "style-loader!css-loader"
        },
        {
          test: /.styl$/,
          include,
          exclude,
          loader: "style-loader!css-loader!stylus-loader"
        }
      ]
    }
  };
};

/*
 * Conf parts for static files
 */
exports.gexfCopier = (
  {
    include,
    exclude
  }
) => {
  return {
    module: {
      rules: [
        {
          test: /\.gexf$/,
          include,
          exclude,
          loader: "file-loader"
        }
      ]
    }
  };
};

exports.jsonLoader = {
  module: {
    rules: [
      {
        test: /\.json$/,
        loader: "json-loader"
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
        loader: "transform?brfs"
      }
    ]
  }
};
