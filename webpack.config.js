var Webpack = require('webpack');
var path = require('path');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var buildPath = path.resolve(__dirname, 'public', 'build');
var mainPath = path.resolve(__dirname, 'main.js');

var precss       = require('precss');
var autoprefixer = require('autoprefixer');

var isProduction = process.env.NODE_ENV === 'production';

var config = {

  // Makes sure errors in console map to the correct file
  // and line number
  devtool: 'eval',
  entry: [
    // For hot style updates
    'webpack/hot/dev-server',
    // The script refreshing the browser on none hot updates
    'webpack-dev-server/client?http://localhost:8080',
    // Our application
    mainPath],
  output: {
    // We need to give Webpack a path. It does not actually need it,
    // because files are kept in memory in webpack-dev-server, but an
    // error will occur if nothing is specified. We use the buildPath
    // as that points to where the files will eventually be bundled
    // in production
    path: buildPath,
    filename: 'bundle.js',
    // Everything related to Webpack should go through a build path,
    // localhost:3000/build. That makes proxying easier to handle
    publicPath: '/build/'
  },
  module: {
    loaders: [
      // I highly recommend using the babel-loader as it gives you
      // ES6/7 syntax and JSX transpiling out of the box
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, './selectors/'),
          path.resolve(__dirname, './scenes/'),
          path.resolve(__dirname, './redux/'),
          path.resolve(__dirname, './containers/'),
          path.resolve(__dirname, './components/'),
          path.resolve(__dirname, './main.js')
        ],
        exclude: [nodeModulesPath],
        loader: 'babel',
        query: {
          presets : ["react","es2015","stage-1"],
          plugins: ['transform-decorators-legacy'],
          babelrc: false
        }
      },
      // Let us also add the style-loader and css-loader, which you can
      // expand with less-loader etc.
      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, './components/'),
          path.resolve(__dirname, './public/styles'),
        ],
        exclude: [nodeModulesPath],
        loaders: [
          'style-loader',
          `css-loader?${JSON.stringify({
            sourceMap: false,
            modules: true,
            localIdentName: true? '[name]_[local]_[hash:base64:3]' : '[hash:base64:4]',
            minimize: false
          })}`,
          'postcss-loader'
        ]
      },
      { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader?limit=10000'
      },
      { test: /\.(eot|ttf|wav|mp3)$/,
        loader: 'file-loader'
      }
    ]
  },
  postcss: function () {
          return [precss, autoprefixer];
  },
  // We have to manually add the Hot Replacement plugin when running
  // from Node
  plugins: [
    new Webpack.HotModuleReplacementPlugin(),
    new Webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ]
};

if(isProduction){
  console.log("Webpack production");
  config.devtool='source-map'
  config.entry.shift();//webpack/hot/dev-server
  config.entry.shift();//webpack-dev-server/client?http://localhost:8080
  config.plugins.shift();//Webpack.HotModuleReplacementPlugin()
  console.log("  entry="+config.entry);
}

module.exports = config;
