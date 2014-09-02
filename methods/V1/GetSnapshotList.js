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

    var result = null;
    result = mysql.get_where_in('snapshot',{'user_id':userid});
    res.json(common.succeed(Method, {
        SnapshotList: result
    }));
    return;
});
