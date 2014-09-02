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
    shell = require('shelljs'),
    Method = path.basename(__filename, '.js');

var FILTER_PATH = config.custom_filter_path;
var PATTERN_PATH = config.logstash_pattern_path;
//var FILTER_PATH = '/data/bianjie/conf.d/';
//var PATTERN_PATH = '/data/bianjie/patterns/';
var CUSTOM_PATTERN_FILE_NAME = 'custom';
var GLOBAL_PATTERN_FILE_NAME = 'basic';

app.post('/' + Method, base.Connect(),function(req, res) {

    //Require
    var userid = req.UserId;
    if (!userid) {
        res.json(common.fail(-1, Method, 'Missing parameter: UserId'));
        return;
    }
    var type = req.body.Type;
    if (!type) {
        res.json(common.fail(-1, Method, 'Missing parameter: Type'));
        return;
    }
    type = userid + '_' + type;
    var patternName = req.body.PatternName;
    if (!patternName) {
        res.json(common.fail(-1, Method, 'Missing parameter: PatternName'));
        return;
    }
    patternName = userid + '_' + patternName;
    var patternExp = req.body.PatternExp;
    if (!patternExp) {
        res.json(common.fail(-1, Method, 'Missing parameter: PatternExp'));
        return;
    }
    console.log('userid',userid,'type',type,'pattername',patternName,'patternexp',patternExp);

    var result = null;
    result = mysql.get_where_in('custom_logtype', {'user_id':userid});
    console.log(result);
    for (var i in result) {
        if (result[i].type == type) {
            res.json(common.fail(-1, Method, 'custom type name already exist.'));
            return;
        } else if (result[i].pattern == patternName) {
            res.json(common.fail(-1, Method, 'custom pattern name already exist.'));
            return;
        }
    }
    result = addCustomPattern(patternName, patternExp, userid);
    if (result.success) {
        console.log('add custom pattern succeeded.');
    } else {
        console.error('[error]', result.error);
        res.json(common.fail(-2, Method, result.error));
        return;
    }
    result = addCustomFilter(type, patternName, userid);
    if (result.success) {
        console.log('add custom filter succeeded.');
    } else {
        console.error('[error]', result.error);
        res.json(common.fail(-2, Method, result.error));
        return;
    }   
    //check config file
    cprocess.exec('/opt/logstash/bin/logstash -t --config=' + FILTER_PATH, function(error, stdout, stderr) {
        fibers(function(){
            if (stdout.indexOf('Error') >=0) {
                console.error('[error] logstash config checking failed.');
                res.json(common.fail(-3, Method, 'logstash config checking failed. userid:', userid));
                return;
            } else {
                result = mysql.insert('custom_logtype', {'user_id':userid,'type':type,'pattern':patternName,'patternexp':patternExp});
                shell.exec('sudo /data/sevnote/logstash/bin/init reload').code;
                console.log('[success] logstash config checking succeeded. userid:',userid);
                res.json(common.succeed(Method, {}));
                return;
            }   
        }).run();
    }); 
});

function addCustomFilter(type, patternName, userId) {
    //用户没有配置文件则添加一个空userId.conf文件
    var filepath = getUserFilterFilePath(userId);
    if (!fs.existsSync(filepath)) {
        return {success:false, error:'user conf file does not exist.userid:' + userId};
    }
    var confstr = fs.readFileSync(filepath, {encoding:'utf8'});
    //console.log(confstr);
    //console.log('===============');
    
    //检查是否有重复filter
    if (confstr.indexOf('add_tag => "' + type + '"') >= 0) {
        return {success:false, error:'custom type name already exist.'};
    }
    
    //拼装grok过滤器
    var grokfilter = '';
    grokfilter += 'tags => ["user_id_' + userid + '"]\n';
    grokfilter += 'overwrite => "message"\n';
    grokfilter += 'patterns_dir => ["'+PATTERN_PATH+'0","' + PATTERN_PATH +  userId + '"]\n';
    grokfilter += 'match => ["message", "%{' + patternName + '}"]\n';
    grokfilter += 'add_tag => "' + type + '"\n';
    grokfilter += 'add_field => {"type" => "' + type + '"}\n';
    grokfilter += 'tag_on_failure => "not_' + type + '"\n';
    grokfilter = 'grok {\n' + grokfilter + '}\n';
    console.log(grokfilter);
    console.log('===============');
  
    //找到原用户过滤配置文件插入位置并插入grok过滤器
    var insert_pos = confstr.search(/}\s*output\s*{/);
    confstr = confstr.slice(0, insert_pos) + grokfilter + confstr.slice(insert_pos, confstr.length);
    
    var err = fs.writeFileSync(filepath, confstr);
    if (err) {
        console.error('write', filepath, 'failed.');
        return {success:false, error:'write custom config file failed. userid:' + userId};
    }
    return {success:true};
}

function addCustomPattern(patternName, patternExp, userId) {
    //用户没有pattern文件则添加一个空custom文件
    var filepath = getUserPatternFilePath(userId);
    if (!fs.existsSync(filepath)) {
        fs.appendFileSync(filepath,'');
    }
    //检查是否有重复patternName
    var isOk = checkPatternName(patternName, userId);
    if (!isOk) {
        return {
            success: false, error: 'pattern name duplicated'
        };
    }
    fs.appendFileSync(filepath, '\n' + patternName + ' ' + patternExp);
    return {success: true};
}

function getUserFilterFilePath(userId) {
    return FILTER_PATH + userId + '.conf';
}

function getUserPatternFilePath(userId) {
    return PATTERN_PATH + userId + '/' + CUSTOM_PATTERN_FILE_NAME;
}

function getGlobalPatternFilePath() {
    return PATTERN_PATH + '0/' + GLOBAL_PATTERN_FILE_NAME;
}

function getPatternNames(filePath) {
    var patternStr = fs.readFileSync(filePath, {encoding:'utf8'});
    var lines = patternStr.split('\n');
    var patternNames = [];
    for (var i in lines) {
        var name = lines[i].trim().split(' ')[0];
        if (name) {
            patternNames.push(name);
        }
    }
    return patternNames;
}

function checkPatternName(patternName, userId) {
    //获取global pattern name
    var globalPath = getGlobalPatternFilePath();
    var globalPatternNames = getPatternNames(globalPath);
    
    //获取用户已有自定义pattern name
    var userPath = getUserPatternFilePath(userId);
    var userPatternNames = getPatternNames(userPath);
   
    var patternNames = globalPatternNames.concat(userPatternNames);
    if (patternNames.indexOf(patternName) >= 0) {
        return false;
    } else {
        return true;
    }
}
