const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './examples/index.js',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['eslint-loader'],
      },
      {
        test: /.mdx?$/,
        use: [
          'babel-loader',
          '@mdx-js/loader',
        ],
      },
      {
        test: /\.(less|css)$/,
        use: [{
          loader: 'style-loader', // creates style nodes from JS strings
        }, {
          loader: 'css-loader', // translates CSS into CommonJS
        }, {
          loader: 'less-loader', // compiles Less to CSS
        }],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: {
      'space.db': path.resolve(__dirname, 'src/space.db.js'),
    },
  },
  output: {
    path: `${__dirname}/examples/dist`,
    publicPath: '/',
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  devtool: 'eval-source-map',
  devServer: {
    contentBase: './examples/dist',
    hot: true,
  },
};
