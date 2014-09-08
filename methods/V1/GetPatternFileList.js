var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    fs = require('fs'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    Method = path.basename(__filename, '.js');


app.post('/' + Method,base.Connect(), function(req, res) {

    var path0 = "/data/sevnote/logstash/etc/patterns/0";
    var path1 = "/data/sevnote/logstash/etc/patterns/1";

    var basic_files = fs.readdirSync(path0);
    var custom_files = fs.readdirSync(path1);

    res.json(common.succeed(
        Method, {
            BasicPattern: basic_files,
            CustomPattern: custom_files,
        }
    ));
});
