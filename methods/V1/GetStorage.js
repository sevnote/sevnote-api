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


app.post('/'+Method,base.Connect(), function(req, res) {
   var params = ({
    bytes:'m',
    index:'_all'
    //index:'user-'+userid+'-*'
   })
   var result = es.catIndices(params);

   console.log(result);
   var array = result.split("\n");
   array.splice(-1);
   var json = [];
   for(var i in array){
      var row = array[i].replace(/\s+/g, " ");
      var row = row.split(' ');
      console.log(row[5]);

      var data = ({
        'health' : row[0],
        'index'  : row[1],
        'shared' : row[2],
        'replication': row[3],
        'count' : row[4],
        'delete': row[5],
        'size': row[6],
      })

      json.push(data);
   }


    res.json(common.succeed(
        Method,
        json
    ));
});
