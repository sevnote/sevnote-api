var fibers = require("fibers");
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var RedisStore = require('connect-redis')(express);
var cors = require('cors');
var common = require('./lib/common');
var http = require('http').Server(app);
var path = require('path');
var util = require('util');
moment = require('moment');
config = require("./config/config.json")[app.get("env")];
upload = require('jquery-file-upload-middleware');
moment = require('moment');
_ = require('underscore');
var mysql = require('./lib/mysql');
var rand = require("random-key");
console.log(rand.generate());

GLOBAL.API_PATH = config.api_domain;

// all environments
app.use(cors());
app.set('port', config.app_port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('FhDIjP5784Us9M1V'));
app.use(express.session({
    store: new RedisStore(config.redis_store)
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);



//Upload Function
app.use('/upload', function(req, res, next) {
    // imageVersions are taken from upload.configure()
    upload.fileHandler({
        uploadDir: function() {
            return 'public/uploads'
        }
    })(req, res, next);
});

//Upload Finish Event
upload.on('end', function(fileInfo) {
    var extension = common.extension(fileInfo.originalName);
    var target_path = __dirname + '/public/uploads/' + fileInfo.filename + '.jpeg';
    // Move File
    var tmp_path = __dirname + '/public/uploads/' + fileInfo.originalName;

    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        fs.unlink(tmp_path, function() {
            if (err) throw err;
        });
    });

});


app.all("*", function(req, res, next) {
    fibers(function() {
        next();
    }).run();
})


app.get("/", function(req, res, next) {
    res.json({
        RetCode: 10000,
        ErrorMessage: 'Fatal error'
    })
});

var methods_path = util.format("./methods/%s",(config.api_version));

fs.readdir(methods_path,function(err,methods){
            for(var i in methods){
                var method = methods[i].split(".").shift(); 
                var method = methods_path + '/' + method;
                app.use(require(method))

            }
        });


http.listen(app.get('port'), function() {
    console.info("listening :" + app.get("port"));
});
