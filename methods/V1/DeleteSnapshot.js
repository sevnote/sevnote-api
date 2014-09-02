var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    moment = require('moment'),
    fs = require('fs'),
    cprocess = require('child_process'),
    mysql = require('../../lib/mysql'),
    fibers = require('fibers'),
    Method = path.basename(__filename, '.js');

app.post('/' + Method, base.Connect(),function(req, res) {
    //Require
    var userid = req.UserId;
    if (!userid) {
        res.json(common.fail(-1, Method, 'Missing parameter: UserId'));
        return;
    }
    var name = req.body.Name;
    if (!name) {
        res.json(common.fail(-1, Method, 'Missing parameter: Name'));
        return;
    }
    console.log('userid',userid,'name',name);

    var result = null;
    result = mysql.delete('snapshot', {'user_id':userid, 'name':name});
    console.log(result);
    if (result.affectedRows != 0) {
        res.json(common.succeed(Method, {}));
        return;
    } else {
        res.json(common.fail(-1, Method, 'snap not exists'));
        return;
    }
});
