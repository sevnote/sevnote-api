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
    var filter = req.body.Filter;
    if (!filter) {
        res.json(common.fail(-1, Method, 'Missing parameter: Filter'));
        return;
    }
    //Optional
    var description = req.body.Description || '';
    console.log('userid',userid, 'name',name, 'filter',filter, 'description',description);

    var result = null;
    result = mysql.get_where_in('snapshot',{'name':name,'user_id':userid});
    console.log(result);
    if (result.length == 0) {
        var today = new Date().getTime();
        result = mysql.insert('snapshot',
                {'user_id':userid,'name':name,'filter':filter,'description':description,'createdate':today});
        res.json(common.succeed(Method, {}));
        return;
    } else {
        res.json(common.fail(-1, Method, 'snapshot name exists'));
        return;
    }
});
