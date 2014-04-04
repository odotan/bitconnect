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

function makeMessage(profile, otherUserId, msg, res, fb) {
    var scope = {}, isUser = false;
    async.series([

        function(cb2) {
            db.User.findOne({
                id: profile.id
            }, setter(scope, 'user', cb2));
        },
                function(cb2) {
            if (!scope.user) return res.json('unauthorized', 403);
            db.User.findOne({
                $or: [{
                    username: otherUserId
                }, {
                    id: otherUserId
                }]
            }, setter(scope, 'otherUser', cb2));
        },
        function(cb2) {
            if (!scope.otherUser) {
                if (parseInt(otherUserId)) {
                    scope.otherUser = {
                        id: otherUserId
                    };
                } else {
                    return res.json('recipient not found', 400);
                }
            } else {
                isUser = true;
            }
            scope.request = {
                requestType: constants.RequestTypes.GIVE,
                recipient: dumpUser(scope.otherUser),
                sender: dumpUser(scope.user),
                message: msg,
                id: util.randomHex(32),
                timestamp: new Date().getTime() / 1000,
                cancelled: true
            };
            db.RequestArchive.insert(scope.request, cb2);
        },
        function(cb2) {
            if (!isUser) {
                return cb2();
            }
            var token = fb.getApplicationAccessToken(),
                msg = profile.first_name + ' sent you a message.';
            fb.api('/' + scope.otherUser.id + '/notifications', 'POST', {
                access_token: token,
                template: msg,
                href: '?src=getRequest&userId=' + profile.userId
            }, cb2);
        }
    ], mkrespcb(res, 400, function() {
        res.json(scope.request);
    }));
}

function makeGetRequest(getterProfile, giver, sat, tnx, msg, res, fb) {
    console.log('making get request');
    var scope = {}, isUser = false;
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
                if (parseInt(giver)) {
                    scope.payer = {
                        id: giver
                    };
                } else {
                    return res.json('payer not found', 400);
                }
            } else {
                isUser = true;
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
        },
        function(cb2) {
            if (!isUser) {
                return cb2();
            }
            var token = fb.getApplicationAccessToken(),
                amount = tnx > 0 ? tnx + " thanx" : sat + " satoshi",
                msg = getterProfile.first_name + ' has requested to receive ' + amount + ' from you. Click to accept it.';
            fb.api('/' + scope.payer.id + '/notifications', 'POST', {
                access_token: token,
                template: msg,
                href: '?src=getRequest&userId=' + getterProfile.id
            }, cb2);
        }
    ], mkrespcb(res, 400, function() {
        res.json(scope.request);
    }));
}

function makeGiveRequest(giverProfile, getter, sat, tnx, msg, res, fb) {
    console.log('making give request');
    var scope = {}, isUser = false;
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
                if (parseInt(getter)) {
                    scope.payee = {
                        id: getter
                    };
                } else {
                    return res.json('payee not found', 400);
                }
            } else {
                isUser = true;
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
        },
        function(cb2) {
            if (!isUser) {
                return cb2();
            }
            var token = fb.getApplicationAccessToken(),
                amount = tnx > 0 ? tnx + " thanx" : sat + " satoshi",
                msg = giverProfile.first_name + ' wants to send you ' + amount + '. Click to accept it.';
            fb.api('/' + scope.payee.id + '/notifications', 'POST', {
                access_token: token,
                template: msg,
                href: '?src=giveRequest&userId=' + giverProfile.Id
            }, cb2);
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
        requestType = req.param('requestType'),
        fb = req.facebook;
    if (!tnx && !sat) {
        makeMessage(profile, req.param('giveTo') || req.param('getFrom'), msg, res, fb)
    } else if (requestType === constants.RequestTypes.GET) {
        var from = req.param('getFrom');
        return makeGetRequest(profile, from, sat, tnx, msg, res, fb);
    } else if (requestType === constants.RequestTypes.GIVE) {
        var to = req.param('giveTo');
        return makeGiveRequest(profile, to, sat, tnx, msg, res, fb);
    } else {
        return res.json('unknown or non existent request type: ' + requestType, 400);
    }
});

// Refuse an request

m.clearRequest = FBify(function(profile, req, res) {
    var cb = mkrespcb(res, 400, function() {
        res.json('gone');
    });
    db.Request.findAndModify({
            id: req.param('request_id'),
            $or: [{
                'sender.id': profile.id
            }, {
                'recipient.id': profile.id
            }]
        }, {}, {}, {
            remove: true
        },
        mkrespcb(res, 400, function(requestObj) {
            function archiveRequest() {
                requestObj.deleteTimestamp = new Date().getTime() / 1000;
                db.RequestArchive.insert(requestObj);
            }
            if (!requestObj) {
                res.json('request not found', 404);
                return;
            }
            if (requestObj.sender.id === profile.id) {
                requestObj.cancelled = true;
                archiveRequest();
                cb();
                return;
            }
            requestObj.rejected = true;
            archiveRequest();
            // notify request sender:
            var token = req.facebook.getApplicationAccessToken(),
                amount = requestObj.sat > 0 ? requestObj.sat + " satoshi" : requestObj.tnx + " thanx",
                reqType = requestObj.requestType === constants.RequestTypes.GET ? 'get' : 'give',
                msg;

            if (reqType === 'get') {
                msg = profile.first_name + ' didn\'t accept your request to send ' + amount + '.';
            } else {
                msg = profile.first_name + ' didn\'t accept the ' + amount + ' you sent.';
            }

            req.facebook.api('/' + requestObj.sender.id + '/notifications', 'POST', {
                access_token: token,
                template: msg,
                href: '?src=rejectRequest&userId' + profile.id
            }, cb);
        }));
});

// Payment requests

m.getPendingRequests = FBify(function(profile, req, res) {
    db.Request.find({
        $or: [{
            'recipient.id': 'profile.id'
        }, {
            'sender.id': profile.id
        }]
    })
        .sort({
            timestamp: -1
        })
        .toArray(mkrespcb(res, 400, function(result) {
            var finalResult = {
                incoming: {
                    get: [],
                    give: []
                },
                outgoing: {
                    get: [],
                    give: []
                }
            };
            result.forEach(function(request) {
                var direction, type;
                if (request.sender.id === profile.id) {
                    direction = 'outgoing';
                } else if (request.recipient.id === profile.id) {
                    direction = 'incoming';
                }
                if (request.requestType === constants.RequestTypes.GET) {
                    type = 'get';
                } else if (request.requestType === constants.RequestTypes.GIVE) {
                    type = 'give';
                }
                if (direction && type) {
                    finalResult[direction][type].push(request);
                }
            });
            res.json(finalResult, 200);
        }));
});

// Send thanx (raw function) - accepts mongodb queries for from and to arguments

var rawsend = function(fromquery, toquery, tnx, txType, cb, message, request) {
    if (!parseInt(tnx)) return cb('invalid tnx count');
    if (tnx < 0) return cb('you can\'t send a negative amount');
    var scope = {};
    async.series([

        function(cb2) {
            db.User.findOne(fromquery, setter(scope, 'from', cb2));
        },
        function(cb2) {
            if (!scope.from) return cb('user not found');
            scope.from.tnx = parseInt(scope.from.tnx);
            if (scope.from.tnx < tnx) return cb('sender too poor');
            db.User.findOne(toquery, setter(scope, 'to', cb2));
        },
        function(cb2) {
            if (!scope.to) return cb('user not found');
            db.User.update({
                id: scope.from.id
            }, {
                $set: {
                    tnx: scope.from.tnx - tnx
                }
            }, cb2);
        },
        function(cb2) {
            db.User.update({
                id: scope.to.id
            }, {
                $set: {
                    tnx: (scope.to.tnx || 0) + tnx
                }
            }, cb2);
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
            }, cb2);
        }
    ], eh(cb, function() {
        cb(null, 'success');
    }));
};

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
                message,
                request);
        },
        function(cb2) {
            db.Request.findAndModify({
                id: request
            }, {}, {}, {
                remove: true
            }, function(err, requestObj) {
                requestObj.timestamp = new Date().getTime() / 1000;
                db.RequestArchive.insert(requestObj);
                var token = req.facebook.getApplicationAccessToken(),
                    amount = tnx + " thanx",
                    msg = profile.first_name + ' sent you ' + amount + ' that you requested.';
                req.facebook.api('/' + requestObj.sender.id + '/notifications', 'POST', {
                    access_token: token,
                    template: msg,
                    href: '?src=confirmGet&userId=' & profile.id
                }, cb2);
            });

        }
    ], mkrespcb(res, 400, function(x) {
        res.json('success');
    }));
});

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
                requestTimestamp: scope.request.timestamp,
                timestamp: new Date().getTime() / 1000
            }, cb);
        },
        function(cb) {
            db.Request.findAndModify({
                id: scope.request.id
            }, {}, {}, {
                remove: true
            }, function(err, requestObj) {
                requestObj.archiveTimestamp = new Date().getTime() / 1000;
                db.RequestArchive.insert(requestObj);
                var token = req.facebook.getApplicationAccessToken(),
                    amount = scope.request.tnx + " thanx",
                    msg = profile.first_name + ' accepted the ' + amount + ' you sent.';
                req.facebook.api('/' + requestObj.sender.id + '/notifications', 'POST', {
                    access_token: token,
                    template: msg,
                    href: '?src=confirmGive&userId=' & profile.id
                }, cb);
            });
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
        }]
    })
        .sort({
            timestamp: -1
        })
        .toArray(mkrespcb(res, 400, function(results) {
            db.RequestArchive.find({
                $and: [{
                    $or: [{
                        rejected: true
                    }, {
                        cancelled: true
                    }]
                }, {
                    $or: [{
                        'sender.id': profile.id
                    }, {
                        'recipient.id': profile.id
                    }]
                }]
            }).toArray(mkrespcb(res, 400, function(results2) {
                results2.forEach(function(request) {
                    var senderKey, recipientKey;
                    senderKey = request.requestType === constants.RequestTypes.GET ? 'payee' : 'payer';
                    recipientKey = request.requestType === constants.RequestTypes.GET ? 'payer' : 'payee';
                    request[senderKey] = request.sender;
                    request[recipientKey] = request.recipient;
                    request.sender = undefined;
                    request.recipient = undefined;
                });
                var history = results.concat(results2);
                history.sort(function compare(item1, item2) {
                    return -(item1.timestamp - item2.timestamp);
                });
                res.json(history);
            }));
        }));
});

m.getInteractionWithUser = FBify(function(profile, req, res) {
    var otherUserId = req.param('otherUserId'),
        scope = {};
    if (!otherUserId) {
        return res.json('missing user id', 400);
    }
    if (otherUserId === profile.id) {
        return res.json('cannot chat with yourself', 400);
    }
    async.series([

            function(cb) {
                db.User.findOne({
                    id: otherUserId
                }, setter(scope, 'user', cb));
            },
            function(cb) {
                if (!scope.user) {
                    return res.json('user not found', 400);
                }
                // get transactions:
                db.Transaction.find({
                    $or: [{
                        'payer.id': profile.id,
                        'payee.id': otherUserId
                    }, {
                        'payee.id': profile.id,
                        'payer.id': otherUserId
                    }]
                })
                    .sort({
                        timestamp: -1
                    })
                    .toArray(setter(scope, 'transactions', cb));
            },
            function(cb) {
                // get archived requests:
                db.RequestArchive.find({
                    $and: [{
                        $or: [{
                            rejected: true
                        }, {
                            cancelled: true
                        }]
                    }, {
                        $or: [{
                            'sender.id': profile.id,
                            'recipient.id': otherUserId
                        }, {
                            'recipient.id': profile.id,
                            'sender.id': otherUserId
                        }]
                    }]
                }).toArray(setter(scope, 'archive', cb));
            },
            function(cb) {
                // get pending requests:
                db.Request.find({
                    $or: [{
                        'sender.id': profile.id,
                        'recipient.id': otherUserId
                    }, {
                        'recipient.id': profile.id,
                        'sender.id': otherUserId
                    }]
                }).toArray(setter(scope, 'requests', cb));
            }
        ],
        mkrespcb(res, 400, function() {
            scope.transactions.forEach(function(tx) {
                if (tx.txType === constants.TxTypes.getRequest) {
                    tx.sender = {
                        id: tx.payee.id
                    };
                } else if (tx.txType === constants.TxTypes.giveRequest) {
                    tx.sender = {
                        id: tx.payer.id
                    };
                }
            });
            var results = scope.archive.concat(scope.requests).concat(scope.transactions);
            results.sort(function compare(item1, item2) {
                return ((item1.requestTimestamp || item1.timestamp) - (item2.requestTimestamp || item2.timestamp));
            });
            res.json(results);
        }));
});