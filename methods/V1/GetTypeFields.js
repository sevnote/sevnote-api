var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    moment = require('moment'),
    Method = path.basename(__filename, '.js');


app.post('/' + Method, base.Connect(),function(req, res) {

    //Require
    var type = req.body.Type;
    if (!type) {
        res.json(common.fail(-1, Method, 'Missing parameter: Type'));
        return;
    }

    //Optional
    var index = undefined === req.body.Index
              ? '_all'
              : req.body.Index;

    var result = es.getMapping(index, type);
    result = result[Object.keys(result)[0]].mappings[type].properties;
    //去除带'@'的field
    var blist = ['@timestamp', '@version', 'type', 'message', 'tags', 'timestamp', 'uuid'];
    for (var field in result) {
        if (blist.indexOf(field) >= 0) {
            delete result[field];
        }
    }
    res.json(common.succeed(
        Method,
        {
            TypeFields: Object.keys(result)
        }
    ));
});
