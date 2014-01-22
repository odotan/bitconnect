var db = require('./db'),
    util = require('./util'),
    async = require('async'),
    _ = require('underscore'),
    Bitcoin = require('bitcoinjs-lib'),
    constants = require('./constants');

var eh = util.eh,
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter,
    pybtctool = util.pybtctool,
    FBify = util.FBify,
    dumpUser = util.dumpUser;

var m = module.exports = {};

function makeGetRequest(getterProfile, giver, sat, tnx, msg, res) {
    console.log('making get request');
    var scope = {};
    async.series([

        function(cb2) {
            db.User.findOne({
                id: getterProfile.id
            }, setter(scope, 'payee', cb2));
        },
        function(cb2) {
            if (!scope.payee) return res.json('unauthorized', 403);
            db.User.findOne({
                $or: [{
                    username: giver
                }, {
                    id: giver
                }]
            }, setter(scope, 'payer', cb2));
        },
        function(cb2) {
            if (!scope.payer) {
                if (parseInt(payer)) {
                    scope.payer = {
                        id: payer
                    };
                } else {
                    return res.json('payer not found', 400);
                }
            }

            scope.request = {
                requestType: constants.RequestTypes.GET,
                recipient: dumpUser(scope.payer),
                sender: dumpUser(scope.payee),
                sat: sat,
                tnx: tnx,
                message: msg,
                id: util.randomHex(32),
                timestamp: new Date().getTime() / 1000
            };
            db.Request.insert(scope.request, cb2);
        }
    ], mkrespcb(res, 400, function() {
        res.json(scope.request);
    }));
}

function makeGiveRequest(giverProfile, getter, sat, tnx, msg, res) {
    console.log('making give request');
    var scope = {};
    async.series([

        function(cb2) {
            db.User.findOne({
                id: giverProfile.id
            }, setter(scope, 'payer', cb2));
        },
        function(cb2) {
            if (!scope.payer) return res.json('unauthorized', 403);
            db.User.findOne({
                $or: [{
                    username: getter
                }, {
                    id: getter
                }]
            }, setter(scope, 'payee', cb2));
        },
        function(cb2) {
            if (!scope.payee) {
                if (parseInt(payee)) {
                    scope.payee = {
                        id: payee
                    };
                } else {
                    return res.json('payee not found', 400);
                }
            }

            scope.request = {
                requestType: constants.RequestTypes.GIVE,
                sender: dumpUser(scope.payer),
                recipient: dumpUser(scope.payee),
                sat: sat,
                tnx: tnx,
                message: msg,
                id: util.randomHex(32),
                timestamp: new Date().getTime() / 1000
            };
            db.Request.insert(scope.request, cb2);
        }
    ], mkrespcb(res, 400, function() {
        res.json(scope.request);
    }));
}
// Make an request

m.mkRequest = FBify(function(profile, req, res) {
    var sat = parseInt(req.param('sat')) || Math.ceil(parseFloat(req.param('btc')) * 100000000) || 0,
        tnx = parseInt(req.param('tnx')) || 0,
        msg = req.param('message') || '',
        requestType = req.param('requestType');
    if (requestType === constants.RequestTypes.GET) {
        var from = req.param('getFrom');
        return makeGetRequest(profile, from, sat, tnx, msg, res);
    } else if (requestType === constants.RequestTypes.GIVE) {
        var to = req.param('giveTo');
        return makeGiveRequest(profile, to, sat, tnx, msg, res);
    } else {
        return res.json('unknown or non existent request type: ' + requestType, 400);
    }
});

// Refuse an request

m.clearRequest = FBify(function(profile, req, res) {
    db.Request.remove({
            id: req.param('request_id')
        },
        mkrespcb(res, 400, function() {
            res.json('gone')
        }))
});

// Payment requests

m.getIncomingRequests = FBify(function(profile, req, res) {
    db.Request.find({
        'recipient.id': profile.id
    })
        .sort({
            timestamp: -1
        })
        .toArray(mkrespcb(res, 400, _.bind(res.json, res)))
});

m.getOutgoingRequests = FBify(function(profile, req, res) {
    db.Request.find({
        'sender.id': profile.id
    })
        .sort({
            timestamp: -1
        })
        .toArray(mkrespcb(res, 400, _.bind(res.json, res)))
});
// Send thanx (raw function) - accepts mongodb queries for from and to arguments

var rawsend = function(fromquery, toquery, tnx, txType, cb, message) {
    if (!parseInt(tnx)) return cb('invalid tnx count')
    if (tnx < 0) return cb('you can\'t send a negative amount, you clever thief!')
    var scope = {}
    async.series([

        function(cb2) {
            db.User.findOne(fromquery, setter(scope, 'from', cb2))
        },
        function(cb2) {
            if (!scope.from) return cb('user not found')
            scope.from.tnx = parseInt(scope.from.tnx)
            if (scope.from.tnx < tnx) return cb('sender too poor')
            db.User.findOne(toquery, setter(scope, 'to', cb2))
        },
        function(cb2) {
            if (!scope.to) return cb('user not found')
            db.User.update({
                id: scope.from.id
            }, {
                $set: {
                    tnx: scope.from.tnx - tnx
                }
            }, cb2)
        },
        function(cb2) {
            db.User.update({
                id: scope.to.id
            }, {
                $set: {
                    tnx: (scope.to.tnx || 0) + tnx
                }
            }, cb2)
        },
        function(cb2) {
            db.Transaction.insert({
                payer: dumpUser(scope.from),
                payee: dumpUser(scope.to),
                id: util.randomHex(32),
                tnx: tnx,
                txType: txType,
                message: message,
                timestamp: new Date().getTime() / 1000
            }, cb2)
        }
    ], eh(cb, function() {
        cb(null, 'success')
    }))
}

// Send thanx

m.sendTNX = FBify(function(profile, req, res) {
    var to = req.param('to'),
        tnx = parseInt(req.param('tnx')) || 0,
        message = req.param('message'),
        request = req.param('request'),
        txType = req.param('txType'),
        scope = {};
    console.log(to, tnx, request, message, txType);
    async.series([

        function(cb2) {
            rawsend({
                    id: profile.id
                }, {
                    $or: [{
                        id: to
                    }, {
                        username: to
                    }]
                },
                tnx,
                txType,
                cb2,
                message)
        },
        function(cb2) {
            db.Request.remove({
                id: request
            }, cb2)
        }
    ], mkrespcb(res, 400, function(x) {
        res.json('success')
    }))
})

m.acceptGive = FBify(function(profile, req, res) {
    var scope = {};
    async.series([

        function(cb) {
            db.Request.findOne({
                'id': req.param('requestId')
            }, setter(scope, 'request', cb));
        },
        function(cb) {
            if (!scope.request || scope.request.recipient.id !== profile.id) {
                return res.json('no such request', 400);
            }
            db.User.findOne({
                id: scope.request.sender.id
            }, setter(scope, 'giver', cb));
        },
        function(cb) {
            if (!scope.giver) {
                return res.json('giver not found', 400);
            } else if (scope.giver.tnx < scope.request.tnx) {
                return res.json('giver has insufficient funds', 400);
            }
            db.User.update({
                id: scope.giver.id
            }, {
                $inc: {
                    tnx: -scope.request.tnx
                }
            }, cb);
        },
        function(cb) {
            db.User.update({
                id: profile.id
            }, {
                $inc: {
                    tnx: scope.request.tnx
                }
            }, cb);
        },
        function(cb) {
            db.Transaction.insert({
                payer: dumpUser(scope.giver),
                payee: dumpUser(scope.request.recipient),
                id: util.randomHex(32),
                tnx: scope.request.tnx,
                txType: constants.TxTypes.giveRequest,
                message: scope.request.message,
                timestamp: new Date().getTime() / 1000
            }, cb)
        },
        function(cb) {
            db.Request.remove({
                id: scope.request.id
            }, cb);
        }
    ], mkrespcb(res, 200, function() {
        res.json('success');
    }));
});
// Get a list of all transaction history for the user

m.getHistory = FBify(function(profile, req, res) {
    db.Transaction.find({
        $or: [{
            'payer.id': profile.id
        }, {
            'payee.id': profile.id
        }, ]
    })
        .sort({
            timestamp: -1
        })
        .toArray(mkrespcb(res, 400, _.bind(res.json, res)))
});