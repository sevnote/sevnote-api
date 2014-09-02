var express = require('express'),
    app = module.exports = express(),
    path = require('path');
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    cors = require('cors'),
    ejs = require('elastic.js'),
    Method = path.basename(__filename,'.js');


app.get('/'+Method,base.Connect(), function(req, res) {
    if (es.ping()) {
        res.json(common.succeed(
            Method,
            'ES ALIVED'
        ));
    } else {
        res.json(common.fail(-1, Method, 'ES Die'));
    }
});
