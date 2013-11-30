var db              = require('./db'),
    util            = require('./util'),
    config          = require('./config'),
    async           = require('async'),
    _               = require('underscore'),
    https           = require('https'),
    Bitcoin         = require('bitcoinjs-lib');

var eh = util.eh,
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter,
    pybtctool = util.pybtctool,
    FBify = util.FBify,
    dumpUser = util.dumpUser;

var m = module.exports = {}

m.fetchHeight = function(req,res) {
    pybtctool('last_block_height',mkrespcb(res,400,function(x) { res.json(parseInt(x)) }))
}

m.updateBTCTxs = function(cb) {
    db.Transaction.find({ confirmed: false })
                  .toArray(eh(cb,function(txs) {
        async.map(txs,function(tx,cb2) {
            pybtctool('get_tx_data '+tx.txid,function(e,data) {
                if (e) return cb2();
                try {
                    var jsonobj = JSON.parse(data)
                    if (jsonobj.block_height) {
                        db.Transaction.update({ txid: tx.txid },{ $set: { confirmed: jsonobj.block_height } },cb2)
                    }
                    else cb2();
                }
                catch(e) { cb2(e) }
            })
            
        },cb || function(){})
    }))
}

m.sendBTC = FBify(function(profile, req, res) {
    var tx = req.param('tx'),
        to = req.param('to') || '',
        message = req.param('message'),
        txObj = tx ? Bitcoin.Transaction.deserialize(tx) : null,
        txHash = tx ? Bitcoin.convert.bytesToHex(txObj.getHash()) : null,
        scope = {};

    async.series([
        function(cb2) {
            db.User.findOne({ id: profile.id },setter(scope,'from',cb2))
        },
        function(cb2) {
            if (!scope.from) return res.json('user not found',403)
            if (to.indexOf('.') >= 0)
                db.User.findOne({ username: to },setter(scope,'to',cb2))
            else setter(scope,'to',cb2)(null,{ address: to });
        },
        function(cb2) {
            console.log('pushing',tx);
            pybtctool('pushtx',tx,setter(scope,'result',cb2))
        },
        function(cb2) {
            scope.satsent = 0;
            txObj.outs.map(function(o) {
                if (o.address == scope.to.address) scope.satsent += o.value
            })
            db.Transaction.insert({
                payer: dumpUser(scope.from),
                payee: scope.to.id ? dumpUser(scope.to) : scope.to.address,
                id: util.randomHex(32),
                sat: scope.satsent,
                txid: txHash,
                confirmed: false,
                message: message,
                timestamp: new Date().getTime() / 1000
            },cb2)
        }
    ], mkrespcb(res,400, function() { res.json('success') }))
});


m.getAddressOutputs = function(req,res) {
    pybtctool('history',req.param('address'),mkrespcb(res,400,function(h) {
        res.json(JSON.parse(h))
    }))
}

m.getThanxAddress = function(req,res) {
    res.json({ address: config.thanxAddress })
}

m.buyTNX = FBify(function(profile, req, res) {
    var tx = req.param('tx');
    if (!tx)
        return res.json('need tx',400)
    var tnx = req.param('tnx') || 0,
        txObj = tx ? Bitcoin.Transaction.deserialize(tx) : null,
        txHash = tx ? txObj.getHash() : null,
        scope = {};
    async.series([
        function(cb2) {
            scope.purchase = 0;
            txObj.outs.map(function(o) {
                if (o.address.toString() == config.thanxAddress) scope.purchase += o.value
            })
            if (scope.purchase == 0)
                return res.json('must purchase something!',400)
            db.User.findOne({ id: profile.id },setter(scope,'from',cb2))
        },
        function(cb2) {
            if (!scope.from) return res.json('user not found',403)
            if (scope.purchase + scope.from.tnx < tnx) return res.json('not enough tnx',400)
            console.log('pushing',tx);
            if (tx) pybtctool('pushtx',tx,setter(scope,'result',cb2))
            else cb2();
        },
        function(cb2) {
            db.User.update({ id: scope.from.id },{ $set:
                { tnx: (scope.from.tnx + scope.purchase - tnx) || 0 }
            },cb2)
        },
        function(cb2) {
            db.Transaction.insert({
                payer: dumpUser(scope.from),
                payee: 'thanxbits',
                id: util.randomHex(32),
                sat: scope.purchase,
                txid: txHash,
                confirmed: false,
                timestamp: new Date().getTime() / 1000
            },cb2)
        }
    ], mkrespcb(res,400, function() { res.json('success') }))

})

// Submit your address

m.submitAddress = FBify(function(profile, req, res) {
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (!u) return res.json('user not found',403);
        if (u.address && u.address != req.param('address')) {
            return res.json('incorrect password',400)
        }
        else db.User.update({ id: profile.id },{
            $set: { address: req.param('address') } 
        },mkrespcb(res,400,function() {
            res.json('success');
        }))
    }));
})

var price = 0,
    lastChecked = 0;

m.price = function(req,res) {
    var now = new Date().getTime() / 1000;
    if (now < lastChecked + 60000)
        return res.json(price)
    https.get('https://blockchain.info/ticker',function(r) {
        var d = ''
        r.on('data',function(chunk) { d += chunk })
        r.on('end',function() {
            try {
                price = parseFloat(JSON.parse(d)['USD']['15m']) 
                lastChecked = new Date().getTime() / 1000;
                return res.json(price);
            }
            catch(e) { res.json(e,400) }
        })
        r.on('error',function(e) { res.json(e,400) })
    })
}
