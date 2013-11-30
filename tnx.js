var db              = require('./db'),
    util            = require('./util'),
    async           = require('async'),
    _               = require('underscore'),
    Bitcoin         = require('bitcoinjs-lib');

var eh = util.eh,
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter,
    pybtctool = util.pybtctool,
    FBify = util.FBify,
    dumpUser = util.dumpUser;

var m = module.exports = {}

// Make an request

m.mkRequest = FBify(function(profile, req, res) {
    var payer = req.param('from'),
        sat = parseInt(req.param('sat')) || Math.ceil(parseFloat(req.param('btc')) * 100000000) || 0,
        tnx = parseInt(req.param('tnx')) || 0,
        msg = req.param('message') || '';

    console.log('making request');
    var scope = {};
    async.series([
        function(cb2) {
            db.User.findOne({ id: profile.id },setter(scope,'payee',cb2))
        },
        function(cb2) {
            if (!scope.payee) return res.json('unauthorized',403);
            db.User.findOne({ $or: [ { username: payer }, { id: payer } ] },setter(scope,'payer',cb2))
        },
        function(cb2) {
            if (!scope.payer) {
                if (parseInt(payer)) scope.payer = { id: payer }
                else return res.json('payer not found',400);
            }
            scope.request = {
                payer: dumpUser(scope.payer),
                payee: dumpUser(scope.payee),
                sat: sat,
                tnx: tnx,
                message: msg,
                id: util.randomHex(32),
                timestamp: new Date().getTime() / 1000
            }
            console.log('request',scope.request);
            db.Request.insert(scope.request,cb2)
        }
    ], mkrespcb(res,400,function() { res.json(scope.request) }));
});

// Refuse an request

m.clearRequest = FBify(function(profile, req, res) {
    db.Request.remove({ id: req.param('request_id') },
                        mkrespcb(res,400,function() { res.json('gone') }))
});

// Payment requests

m.getRequests = FBify(function(profile, req, res) {
    db.Request.find({ 'payer.id': profile.id })
              .sort({ timestamp: -1 })
              .toArray(mkrespcb(res,400,_.bind(res.json,res)))
});

// Send thanx (raw function) - accepts mongodb queries for from and to arguments

var rawsend = function(fromquery, toquery, tnx, cb) {
    if (!parseInt(tnx)) return cb('invalid tnx count')
    if (tnx < 0) return cb('you can\'t send a negative amount, you clever thief!')
    var scope = {}
    async.series([
        function(cb2) {
            db.User.findOne(fromquery,setter(scope,'from',cb2))
        },
        function(cb2) {
            if (!scope.from) return cb('user not found')
            scope.from.tnx = parseInt(scope.from.tnx)
            if (scope.from.tnx < tnx) return cb('sender too poor')
            db.User.findOne(toquery,setter(scope,'to',cb2))
        },
        function(cb2) {
            if (!scope.to) return cb('user not found')
            db.User.update({ id: scope.from.id },{ $set:
                { tnx: scope.from.tnx - tnx }
            },cb2)
        },
        function(cb2) {
            db.User.update({ id: scope.to.id },{ $set:
                { tnx: (scope.to.tnx || 0) + tnx }
            },cb2)
        },
        function(cb2) {
            db.Transaction.insert({
                payer: dumpUser(scope.from),
                payee: dumpUser(scope.to),
                id: util.randomHex(32),
                tnx: tnx,
                timestamp: new Date().getTime() / 1000
            },cb2)
        }
    ],eh(cb,function() { cb(null,'success') }))
}

// Send thanx

m.sendTNX = FBify(function(profile, req, res) {
    var to = req.param('to'),
        tnx = parseInt(req.param('tnx')) || 0,
        message = req.param('message'),
        request = req.param('request'),
        scope = {};
    console.log(to, tnx, request, message);
    async.series([
        function(cb2) {
            rawsend({ id: profile.id },
                    { $or: [ { id: to }, { username: to } ] },
                    tnx,
                    cb2)
        },
        function(cb2) {
            db.Request.remove({ id: request },cb2)
        }
    ],mkrespcb(res,400,function(x) { res.json('success') }))
})

// Get a list of all transaction history for the user

m.getHistory = FBify(function(profile, req, res) {
        db.Transaction.find({ $or: [
            { 'payer.id': profile.id },
            { 'payee.id': profile.id },
        ] })
        .sort({ timestamp: -1 })
        .toArray(mkrespcb(res,400,_.bind(res.json,res)))
});
