var Future = require('fibers/future');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: '10.4.12.118:9200',
    log: 'trace'
});


exports.ping = function() {
    var f = new Future;
    client.ping({
        requestTimeout: 1000,
        hello: "elasticsearch!"
    }, function(error) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (true)
        }
    });
    return f.wait();
}

exports.countall = function() {
    var f = new Future;
    client.count(function(error,response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.search = function(params) {
    var f = new Future;
    client.search(params,function(error,response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.get = function(params) {
    var f = new Future;
    client.get(params,function(error,response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}



exports.create = function(params) {
    var f = new Future;
    client.create(params, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.delete = function(params) {
    var f = new Future;
    client.delete(params, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}


exports.deleteMapping = function(index, type) {
    var f = new Future;
    client.indices.deleteMapping({
        index: index,
        type: type
    }, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.getMapping = function(index, type) {
    var f = new Future;
    client.indices.getMapping({
        index: index,
        type: type
    }, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.getSource = function(params) {
    var f = new Future;
    client.getSource(params, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}

exports.catAllocation = function(params) {
    var f = new Future;
    client.cat.allocation(params, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}


exports.catIndices = function(params) {
    var f = new Future;
    client.cat.indices(params, function(error, response) {
        if (error) {
            console.info(error)
            f.
            return (false);
        } else {
            f.
            return (response)
        }
    });
    return f.wait();
}
