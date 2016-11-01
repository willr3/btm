var express = require('express');
var defaultPort = 1492;
var PouchDB = require('pouchdb');
var TmpPouchD = PouchDB.defaults({
  prefix: './pouch/db/',//must already exist on FS
  "log.file": "./pouch/log.txt"

});
var expressPouchDB = require('express-pouchdb')(TmpPouchD, {
  configPath: './pouch/config.json',
  mode: 'fullCouchDB',
  overrideMode: {
    exclude: [
      'routes/authentication',//disable authentication requirements
      'routes/authorization',//depends on authentication
      'routes/session'//depends on authentication
    ]
  }
});

module.exports = function(port){
  if(!port){
    port = defaultPort;
  }
  var app = express();
  app.use(expressPouchDB);
  app.listen(port, function () {
    console.log('Pouch started @ 0.0.0.0:' + port);
  });
}
