var Db              = require('mongodb').Db,
    Connection      = require('mongodb').Connection,
    Server          = require('mongodb').Server,
    BSON            = require('mongodb').BSON,
    ObjectID        = require('mongodb').ObjectID;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null
        ? process.env['MONGO_NODE_DRIVER_HOST']
        : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null
        ? process.env['MONGO_NODE_DRIVER_PORT']
        : Connection.DEFAULT_PORT;

var db = new Db('2fawal', new Server(host, port), {safe: false}, {auto_reconnect: true}, {});

module.exports = {};

db.open(function(err,dbb) {
    if (err) { throw err; }
    db = dbb;
    db.collection('users',function(err,collection) { 
        if (err) { throw err; }
        module.exports.User = collection;
    });
});

