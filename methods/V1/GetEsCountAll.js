var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    Method = path.basename(__filename, '.js');


app.get('/'+Method,base.Connect(), function(req, res) {
    var result = es.countall();
    res.json(common.succeed(
        Method,
        {
            Count: result.count,
            TotalShards: result._shards.total,
            SuccessfulShards: result._shards.successful,
            FailedShards: result._shards.failed
        }
    ));
});
