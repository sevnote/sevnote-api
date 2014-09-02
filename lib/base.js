var common = require('../lib/common');
var fibers = require("fibers");
var es = require('../lib/elasticsearch');
var mysql = require('../lib/mysql');

function get_current_month() {
    var myDate = new Date();
    var YY = myDate.getFullYear()
    var MM = myDate.getMonth() + 1;
    return YY + '-' + MM
}

exports.Connect = function() {
    return function(req, res, next) {
        fibers(function() {
                var path = req.route.path;
                var referer = req.headers.referer;
                var ip = req.ip;
        

                if (req.method === 'POST') {
                    var apikey = req.body.ApiKey
                    if (apikey === undefined) {
                        res.json({
                            RetCode: '-1',
                            ErrorMessage: 'Missing ApiKey'
                        });
                        return;
                    }
                } else if (ip !== '127.0.0.1'){
                        res.json({
                            RetCode:'1000',
                            ErrorMessage:'Call IP Address Error'
                        });
                        return;
                }else {
                    var apikey = req.query.ApiKey;
                    if (apikey === undefined) {
                        res.json({
                            RetCode: '-1',
                            ErrorMessage: 'Missing ApiKey'
                        });
                        return;
                    }
                }

                    //记录操作日志
                    var today = new Date();
                    var date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
                    var time = today.toLocaleTimeString();
                    var forwardedIpsStr = req.header('x-forwarded-for');
                    var data = {
                        index: 'log-' + get_current_month(),
                        type: 'apilog',
                        body: {
                            "apikey": apikey,
                            "ip": forwardedIpsStr,
                            "timestamp": date + " " + time,
                            "method": req.route.path,
                            "post": JSON.stringify(req.body),
                        }
                    };
                    
                    es.create(data);
                    var result = mysql.get_where_in('t_member',{'private_key':apikey})[0];
                    req.UserId = result.user_id;
                    next();
                }).run();
        };
    };
