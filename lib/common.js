exports.succeed = function(action, data) {
    return {
        RetCode: 0,
        Action: action,
        Data: data
    }
}

exports.fail = function(code, action, error) {
    return {
        RetCode: code,
        Action: action,
        ErrorMessage: error
    }
}
