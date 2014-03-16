var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSON,
    ObjectID = require('mongodb').ObjectID,
    constants = require('./constants');

var host = process.env.MONGO_NODE_DRIVER_HOST != null ? process.env.MONGO_NODE_DRIVER_HOST : 'localhost';
var port = process.env.MONGO_NODE_DRIVER_PORT != null ? process.env.MONGO_NODE_DRIVER_PORT : Connection.DEFAULT_PORT;

var db = new Db('bitconnect', new Server(host, port), {
    safe: false
}, {
    auto_reconnect: true
}, {});

module.exports = {};

db.open(function(err, dbb) {
    if (err) {
        throw err;
    }
    db = dbb;
    var databases = {
        'users': 'User',
        'fbinvite': 'FBInvite',
        'requests': 'Request',
        'request-archive': 'RequestArchive',
        'transactions': 'Transaction',
        'system-params': 'SystemParam'
    };
    var callback = function(err, collection) {
        if (err) {
            throw err;
        }
        module.exports[databases[v]] = collection;
    };
    for (var v in databases) {
        db.collection(v, callback);
    }

    db.collection('system-params').findOne({
        key: constants.SystemParamKeys.globalInvitations
    }, function(err, param) {
        if (err || !param) {
            db.collection('system-params').insert({

                "key": "GLOBAL_INVITATIONS",
                "value": {
                    "limit": 32,
                    "remaining": 32,
                    "active": true
                }
            });
        }
    });
});