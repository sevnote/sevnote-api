var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    Method = path.basename(__filename, '.js');


app.post('/' + Method, base.Connect(),function(req, res) {

    //Input params
    var index = req.body.Index;
    var type = req.body.Type;
    var id = req.body.Id;

    //Make params
    var params = ({
        "index": index,
        "type": type,
        "id": id,
    });

    //Output params
    var result = es.get(params);

    res.json(common.succeed(
        Method,
        {
            LogSet: result,
        }
    ));
});
