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

    //Optional
    var from = undefined === req.body.From
               ? new Date('2014-01-01 00:00:00').getTime()
               : new Date(req.body.From).getTime();
    var to = undefined === req.body.To
             ? new Date().getTime()
             : new Date(req.body.To).getTime();

    var esQuery = ejs.BoolQuery();
    esQuery.must(ejs.RangeQuery('@timestamp').from(from).to(to));

    var agg = ejs.FilterAggregation('classcount');
    agg.agg(ejs.TermsAggregation('type').field('_type'));
    agg.filter(ejs.QueryFilter(esQuery));
    var aggparams = {
        //index: 'user-' + userid + '-*',
        index: '_all',
        body: ejs.Request().agg(agg),
        size: 0
    }
    var aggresult = es.search(aggparams);
    //console.log(aggresult);
    //console.log(aggresult.aggregations.classcount.type);
    //console.log(aggresult.hits.hits);
    

    var classCount = {};
    var countResult = aggresult.aggregations.classcount;
    for (var prop in countResult) {
        if (countResult[prop].buckets) {
            classCount[prop] = countResult[prop].buckets;
        }
    }
    res.json(common.succeed(
        Method,
        {
            TypeCount: classCount.type,
            TotalCount: countResult.doc_count
        }
    ));
});
