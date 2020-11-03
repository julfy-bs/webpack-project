const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const { VueLoaderPlugin } = require("vue-loader");

const isDev = process.env.NODE_ENV === "development";
const isProd = !isDev;
const publicPath = "/webpack-project/";

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: "all",
    },
  };

  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetsWebpackPlugin(),
      new TerserWebpackPlugin(),
    ];
  }

  return config;
};

const filename = (ext) =>
  isDev ? `[name].${ext}` : `[name].[hash].build.${ext}`;

const cssLoaders = (extra) => {
  const loaders = [
    {
      loader: isProd ? MiniCssExtractPlugin.loader : "vue-style-loader",
    },
    "css-loader",
  ];

  if (extra) {
    loaders.push(extra);
  }

  return loaders;
};

const jsLoaders = () => {
  const loaders = [
    {
      loader: "babel-loader",
      options: babelOptions(),
    },
  ];

  if (isDev) {
    loaders.push("eslint-loader");
  }

  return loaders;
};

const babelOptions = (preset) => {
  const options = {
    presets: ["@babel/preset-env"],
    plugins: ["@babel/plugin-proposal-class-properties"],
    cacheDirectory: true,
  };

  if (preset) {
    options.presets.push(preset);
  }
  return options;
};

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({
      template: "src/pug/pages/index.pug",
      chunks: ["main"],
      minify: {
        collapseWhitespace: isProd,
      },
    }),
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "src/favicon.png"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: filename("css"),
    }),
    new SpriteLoaderPlugin({
      plainSprite: true,
    }),
    new VueLoaderPlugin(),
  ];

  if (isProd) {
    base.push(new BundleAnalyzerPlugin());
  }

  return base;
};

module.exports = {
  // Базовый каталог, принимает String абсолютный путь для разрешения точек входа и загрузчиков из конфигурации
  // context: path.resolve(__dirname, "./"),
  // Вариант запуска 'webpack', альтернатива - 'production'
  mode: "development",
  // entry:
  // Точка входа js файлов (используется для разбития логики)
  // Например, для подключения сторонней библиотеки
  entry: {
    main: ["@babel/polyfill", "./src/main.js"],
  },
  // output:
  // filename: https://webpack.js.org/configuration/output/#template-strings - полный список доступных темплейтов для имени файла
  // path: Используется для замены директории
  output: {
    filename: filename("js"),
    path: path.resolve(__dirname, "dist"),
    publicPath: isProd ? publicPath : "",
  },
  resolve: {
    // extensions - автоматическое расширение файлов
    extensions: ["*", ".js", ".vue", ".json"],
    // alias - путь к файлу подставляется по значению переменной
    alias: {
      "@src": path.resolve(__dirname, "src"),
      images: path.resolve(__dirname, "src/assets/images"),
    },
  },
  // Настройка для оптимизации финального bundle (убирает повторяющиеся импорты - выносит в отдельный bundle)
  optimization: optimization(),
  // Настройка devServer
  devServer: {
    port: 4200,
    hot: isDev,
    historyApiFallback: true,
    overlay: true,
  },
  devtool: isProd ? false : "source-map",
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: jsLoaders(),
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /^\?vue/,
            use: ["pug-plain-loader"],
          },
          {
            use: [
              {
                loader: "pug-loader",
                options: {
                  pretty: true,
                },
              },
            ],
          },
        ],
      },
      {
        test: /\.(p|post|)css$/,
        use: [
          {
            loader: isProd ? MiniCssExtractPlugin.loader : "vue-style-loader",
          },
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
          {
            loader: "postcss-loader",
            options: {
              sourceMap: true,
              config: { path: "src/postcss.config.js" },
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: cssLoaders("less-loader"),
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders("sass-loader"),
      },
      {
        test: /\.(jpe?g|png|gif|eot|ttf|woff|woff2)$/,
        loader: "file-loader",
        options: {
          name: "[hash].[ext]",
        },
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "svg-sprite-loader",
            options: {
              extract: true,
              // spriteFilename: (svgPath) => `sprite${svgPath.substr(-4)}`,
            },
          },
          "svg-transform-loader",
          {
            loader: "svgo-loader",
            options: {
              plugins: [
                { removeTitle: true },
                {
                  removeAttrs: {
                    attrs: "(fill|stroke)",
                  },
                },
              ],
            },
          },
        ],
      },
      {
        test: /\.xml$/,
        use: ["xml-loader"],
      },
      {
        test: /\.csv$/,
        use: ["csv-loader"],
      },
    ],
  },
};
