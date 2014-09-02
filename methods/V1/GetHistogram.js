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
    var userid = req.UserId;
    if (!userid) {
        res.json(common.fail(-1, Method, 'Missing parameter: UserId'));
        return;
    }

    //Optional
    var type = req.body.Type
    var host = undefined === req.body.Host
                ? '*'
                : req.body.Host;
    var key = undefined === req.body.Key
                ? '*'
                : req.body.Key;
    var interval = undefined === req.body.Interval
              ? '1s'
              : req.body.Interval;

    if (req.body.To) {
        if (!/-+/.test(req.body.To)) {
            var to = parseInt(req.body.To);
        } else {
            var to = new Date(req.body.To).getTime();
        }
    } else {
        var to = new Date().getTime();
    }
    if (req.body.From) {
        if (!/-+/.test(req.body.From)) {
            var from = parseInt(req.body.From);
        } else {
            var from = new Date(req.body.From).getTime();
        }
    } else {
        var from = to - 10000;
    }
    console.log(from, to);

    //用户过滤
    var filters = [];
    filters.push({key:'user_id', value:'"' + userid + '"'});
    //Host过滤
    if (host != '*') {
        filters.push({key:'host', value:'"' + host + '"'});
    }

    var esFilters = ejs.BoolFilter();
    for (var i in filters) {
        var filter = filters[i];
        esFilters.must(ejs.QueryFilter(ejs.QueryStringQuery(filter.value).defaultField(filter.key))); 
    }
    esFilters.must(ejs.RangeFilter('@timestamp').from(from).to(to));
    var searchQuery = ejs.FilteredQuery(
            ejs.QueryStringQuery(key),
            esFilters);
    var searchParams = {
        index: 'user-' + userid + '-*',
        type: type?type:null,
        body: ejs.Request().query(searchQuery).sort('@timestamp', 'desc'),
        size: 100
    }
    var searchResult = es.search(searchParams);
    // console.log(searchResult.hits);

    //分类统计
    var agg = ejs.FilterAggregation('classcount');
    agg.agg(ejs.DateHistogramAggregation('histogram').field('@timestamp').interval(interval));
    agg.filter(ejs.QueryFilter(searchQuery));
    var aggParams = {
        index: 'user-' + userid + '-*',
        type: type?type:null,
        body: ejs.Request().agg(agg),
        size: 0
    }
    var aggResult = es.search(aggParams);

    //console.log(aggResult);
    //console.log(aggResult.aggregations.classcount.priority);
    //console.log(aggResult.hits.hits);
    

    var classCount = {};
    var countResult = aggResult.aggregations.classcount;
    for (var prop in countResult) {
        if (countResult[prop].buckets) {
            classCount[prop] = countResult[prop].buckets;
        }
    }

    //console.log(classCount)
    
    res.json(common.succeed(
        Method,
        {
            LogSets: searchResult.hits.hits,
            ClassCount: classCount,
            TotalCount: searchResult.hits.total
        }
    ));
});
