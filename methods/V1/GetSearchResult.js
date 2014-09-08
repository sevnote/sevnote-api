var express = require('express'),
    app = module.exports = express(),
    path = require('path'),
    base = require('../../lib/base'),
    common = require('../../lib/common'),
    es = require('../../lib/elasticsearch'),
    util = require('util'),
    ejs = require('elastic.js'),
    moment = require('moment'),
    useragent = require('../../lib/useragent'),
    Method = path.basename(__filename, '.js');
    


app.post('/' + Method, base.Connect(),function(req, res) {

    //Require
    var type = req.body.Type;
    
    //Optional
    type = undefined === type
           ? 'syslog'
           : type;
    var key = undefined === req.body.Key
              ? '*'
              : req.body.Key;
    var offset = undefined === req.body.Offset
               ? 0
               : req.body.Offset;
    var size = undefined === req.body.Size
               ? 500
               : req.body.Size;
    var from = undefined === req.body.From
               ? moment().subtract('1','months').toDate().getTime()
               : new Date(req.body.From).getTime();
    var to = undefined === req.body.To
             ? new Date().getTime()
             : new Date(req.body.To).getTime();

    //快速过滤
    var filters = [];
    if (req.body.Filter) {
        console.log(req.body.Filter);
        var f = JSON.parse(req.body.Filter);
        for (var i in f) {
            filters.push({key:f[i].key, value:'"' + f[i].value + '"'}); 
        }
    }
    console.log(filters);
    var esFilters = ejs.BoolFilter();
    for (var i in filters) {
        var filter = filters[i];
        esFilters.must(ejs.QueryFilter(ejs.QueryStringQuery(filter.value).defaultField(filter.key))); 
    }
    esFilters.must(ejs.RangeFilter('@timestamp').from(from).to(to));

    var searchQuery = ejs.FilteredQuery(
            ejs.QueryStringQuery(key),
            esFilters);
    var params = {
        //index: 'user-' + userid + '-*',
        index: '_all',
        type: type,
        body: ejs.Request().query(searchQuery).sort('@timestamp', 'desc'),
        from: offset,
        size: size,
    }

    var result = es.search(params);

    var logs = result.hits.hits;
    for (var i in logs) {
        if (logs[i]._source && logs[i]._source.http_user_agent) {
            var agent = logs[i]._source.http_user_agent;
            agent = agent.replace(/\"/g,'');
            logs[i]._source.http_user_agent = useragent.TranslateUserAgent(agent);
        }
    }
    

    //分类统计
    var agg = ejs.FilterAggregation('classcount');
    var fields = getFields(type);
    if (fields) {
        for (var i in fields) {
            if (fields[i] != 'host') {
                agg.agg(ejs.TermsAggregation(fields[i]).field(fields[i]));
            } else {
                agg.agg(ejs.TermsAggregation(fields[i]).field(fields[i]).exclude('[0-9]+'));
            }
        }
    }
    //分时间区域统计
    var fromMoment = moment(from);
    var toMoment = moment(to);
    var diff = toMoment.diff(fromMoment, 'seconds');
    var histInterval = '';
    if (diff <= 60) {
        histInterval = 'second';
    } else if (diff <= 60*60) {
        histInterval = 'minute';
    } else if (diff <= 60*60*24*7) {
        histInterval = 'hour';
    } else if (diff <= 60*60*24*30) {
        histInterval = 'day';
    } else if (diff <= 60*60*24*30*3) {
        histInterval = 'week';
    } else {
        histInterval = 'month';
    }
    agg.agg(ejs.DateHistogramAggregation('histogram').field('@timestamp').interval(histInterval));
    agg.filter(ejs.QueryFilter(searchQuery));
    var aggparams = {
        type: type,
        body: ejs.Request().agg(agg),
        size: 0
    }
    var aggresult = es.search(aggparams);

    //console.log(aggresult);
    //console.log(aggresult.aggregations.classcount.priority);
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
            LogSets: result.hits.hits,
            ClassCount: classCount,
            TotalCount: result.hits.total,
            Offset: offset
        }
    ));
});

function getFields(type){
    if (!type) {
        return false;
    }   
    //var index = 'user-' + userid + '-*';
    var index = '_all';
    var result = es.getMapping(index, type);
    result = result[Object.keys(result)[0]].mappings[type].properties;
    //去除带'@'的field
    var blist = ['@timestamp', '@version', 'type', 'message', 'tags', 'timestamp', 'uuid'];
    for (var field in result) {
        if (blist.indexOf(field) >= 0) {
            delete result[field];
        }   
    }   
    return Object.keys(result);
}
