var express = require('express');
var path = require('path');
var httpProxy = require('http-proxy');
var router = express.Router();

var proxy = httpProxy.createProxyServer();
var app = express();

app.use(require('compression')());

var isProduction = process.env.NODE_ENV === 'production';
if(!isProduction){
  console.log("Development mode")
}
var port = isProduction ?process.env.PORT : 3000;
port = process.env.PORT || 3000;
var publicPath = path.resolve(__dirname, '..','public');

//PouchServer
// var pouch = require('./pouchdb.js');
// pouch();
// app.all('/pouch/*', function (req, res) {
//   req.url=req.url.substring(req.url.indexOf('/',1));//strip out /pouch/
//   // console.log("POUCH "+req.originalUrl+" >> "+req.url);
//   proxy.web(req, res, {
//       target: 'http://localhost:1492'
//   });
// });
//

//app.use(require("./express/middleware/ls")('/home/wreicher/code/github/'/*'/home/wreicher/perfWork/byteBuffer'*/));//needs to be before express.static
var db = require("./express/middleware/db")

app.use("/db",db);

// We only want to run the workflow when not in production

//before static so we don't serve old webpack builds over the dev
if (!isProduction) {

  // We require the bundler inside the if block because
  // it is only needed in a development environment. Later
  // you will see why this is a good idea
  var bundle = require('./bundle.js');
  bundle();

  // Any requests to localhost:3000/build is proxied
  // to webpack-dev-server
  app.all('/build/*', function (req, res) {
    proxy.web(req, res, {
        target: 'http://localhost:3030'
    });
  });

}
app.use(express.static(publicPath));

//This must be last to avoid overriding calls to /build/*
app.get('*',function(req,res,next){
  //res.render('index.html'); //requires a template engine
  console.log("* -> "+req.url);
  //next();
  res.sendFile(path.join(publicPath, 'index.html'));
});



// It is important to catch any errors from the proxy or the
// server will crash. An example of this is connecting to the
// server when webpack is bundling
proxy.on('error', function(e) {
  console.log('Could not connect to proxy, please try again...');
});

app.listen(port, function () {
  console.log('Server running on port ' + port);
});
