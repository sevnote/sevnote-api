var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    fs = require('fs'),
    ejs = require('elastic.js'),
    Method = path.basename(__filename, '.js'); 


app.post('/' + Method, base.Connect(),function(req, res) {

    //Require
    var userid = req.UserId;
    if (!userid) {
        res.json(common.fail(-1, Method, 'Missing parameter: UserId'));
        return;
    }

    var filename = req.body.FileName;
    if (!filename) {
        res.json(common.fail(-1, Method, 'Missing parameter: FileName'));
        return;
    }


    var path = "/data/sevnote/logstash/etc/patterns/";
    switch (filename){
        case 'custom':
            var file = path + '1/' + filename;
            break;
        default:
            var file = path + '0/' + filename;
            break;
    }

    var file_content = fs.readFileSync(file,'utf8');
    var file = {'filename':file,'filecontent':file_content};

    res.json(common.succeed(
        Method, {
            filename: filename,
            filecontent: file_content,
        }
    ));
});
