var webpack = require( 'webpack' );
var WebpackDevServer = require('webpack-dev-server');
var webpackDevMiddleware = require( 'webpack-dev-middleware' );
var webpackHotMiddleware = require( 'webpack-hot-middleware');
var path = require('path');
var fs = require('fs');
var mainPath = path.resolve(__dirname,"..","main.js");

var webpackConfig = require('./../webpack.config.js');

module.exports = function(){
  // First we fire up Webpack an pass in the configuration we
  // created
  var bundleStart = null;
  var compiler = webpack(webpackConfig);

  // We give notice in the terminal when it starts bundling and
  // set the time it started
  compiler.plugin('compile',function(){
    console.log('Bundling...');
    bundleStart = Date.now();
  })

  // We also give notice when it is done compiling, including the
  // time it took. Nice to have
  compiler.plugin('done', function() {
    console.log('Bundled in ' + (Date.now() - bundleStart) + 'ms!');
  });

  var bundler = new WebpackDevServer(compiler, {
    publicPath : "/build/",
    hot: true,
    quiet: false,
    noInfo: true,
    stats: {
      colors: true,
    }
  })

  bundler.listen(3030,'localhost',function(){
    console.log("Bundling project, please wait...");
  });
}
