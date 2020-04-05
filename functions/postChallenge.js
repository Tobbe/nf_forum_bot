const user = require('./file.json');

exports.handler = function(event, context, callback) {
    callback(null, {
        statusCode: 200,
        body: "Hello, " + user.name
    });
}