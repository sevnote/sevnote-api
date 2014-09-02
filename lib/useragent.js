var agentConfig = require('../config/useragent.json');

exports.TranslateUserAgent = function(useragent) {
    for (var key in agentConfig) {
        var regexp = new RegExp(agentConfig[key]);
        if (regexp.test(useragent)){
            return key;
        }
    }
    return useragent;
}
