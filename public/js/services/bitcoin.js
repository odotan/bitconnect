window.app.service('bitcoin',function($rootScope, $http) {

    $rootScope.bitcoinLogin = function(pw,callback,errback) {
        console.log('bl',pw,callback,errback);
        var key = new Bitcoin.Key(Bitcoin.Crypto.SHA256($rootScope.user.seed + pw)),
            address = key.getBitcoinAddress().toString();

        var success = function() {
            $rootScope.key = key;
            $rootScope.user.address = address;
            if (callback) callback();
        }
        var fail = errback || $rootScope.errHandle;

        if ($rootScope.user && $rootScope.user.address) {
            if (address == $rootScope.user.address) success()
            else fail();
        }
        else if ($rootScope.user) {
            $http.post('/submitaddress',{ address: address })
                 .success(success)
                 .error(fail)
        }
        else $rootScope.errHandle("not logged in");
    }

    $rootScope.checkBitcoinLoggedIn = function(callback) {
        console.log('checking if logged in',$rootScope.user,$rootScope.key);
        if (!$rootScope.user)
            return
        if ($rootScope.key) 
            return callback();
        var fields = {
            'password' : { type: 'password' }
        }
        if (!$rootScope.user.address)
            fields['confirm'] = { type: 'password' }
        $rootScope.message = {
            body: 'please enter password',
            fields: fields,
            canceltext: 'no thanx',
            action: function() {
                if (!$rootScope.user.address
                        && $rootScope.message.fields.password.value != $rootScope.message.fields.confirm.value) {
                    $rootScope.message.body = 'passwords don\'t match, please try again'
                }
                else {
                    $rootScope.bitcoinLogin($rootScope.message.fields.password.value, function() {
                        $rootScope.message = null;
                        if (callback) callback();
                    },function(e) {
                        $rootScope.message.body = e;
                    })
                }
            },
            actiontext: 'log me in'
        }
    }

    $rootScope.bitcoinSend = function(to, satoshis, fee, message, callback) {
        console.log('bitcoinSend', to, satoshis, fee, message, callback);
        if (!fee) fee = 10000;
        satoshis = Math.ceil(satoshis);
        if (!$rootScope.key) {
            $rootScope.checkBitcoinLoggedIn(function() {
                $rootScope.bitcoinSend(to, satoshis, fee);
            })
        }
        else if (!to) {
            $rootScope.errHandle('giving btc to whom?');
        }
        else if (satoshis < 5430) {
            $rootScope.errHandle('must send at least 5430 satoshis');
        }
        else if ($rootScope.balance < satoshis + fee) {
            $rootScope.errHandle('not enough balance!');
        }
        else if (to.indexOf('.') >= 0) {
            $http.get('/userdata?username='+encodeURIComponent(to))
                 .success(function(r) {
                    if (!r[0]) return $rootScope.errHandle('user not found')
                    if (!r[0].address) return $rootScope.errHandle('getter has no address')
                    try {
                        $rootScope.rawSend(r[0].address, satoshis, fee, '/sendbtc', {
                            to: to,
                            message: message 
                        },function() {
                            $rootScope.showMessage('success')
                            if (callback) callback();
                        })
                    }
                    catch(e) { $rootScope.body = e }
                 })
                 .error($rootScope.errHandle);
        }
        else try {
            $rootScope.rawSend(to, satoshis, fee, '/sendbtc', {
                message: message, 
                to: to
            }, function() {
                $rootScope.showMessage('success')
                if (callback) callback();
            })
        }
        catch(e) { $rootScope.body = e }
    }

    var gentx = function(address, satoshis, fee) {
        console.log(address, satoshis, fee);
        var utxo = get_enough_utxo_from_history($rootScope.txouts,satoshis + fee),
            needsplit = Object.keys($rootScope.txouts).length < 5 ? 1 : 2,
            change = _.range(needsplit).map(function(x) {
                            return $rootScope.user.address
                       }),
            tx   = make_sending_transaction(utxo,
                                           address,
                                           satoshis,
                                           change,
                                           fee);

        for (var i = 0; i < tx.ins.length; i++) {
            tx.sign(i,$rootScope.key)
        }
        return tx;
    }

    var processtx = function(tx) {
        var txhash = tx.getHash()
        for (var i = 0; i < tx.outs.length; i++) {
            if (tx.outs[i].address == $rootScope.user.address) {
                $rootScope.txouts[txhash+':'+i] = {
                    output: txhash+':'+i,
                    value: tx.outs[i].value,
                    timestamp: new Date().getTime() / 1000,
                    pending: true
                }
            }
        }
        for (var i = 0; i < tx.ins.length; i++) {
            var op = tx.ins[i].outpoint 
            var o = $rootScope.txouts[op.hash+':'+op.index]
            if (o) {
                o.spend = true
                o.timestamp = new Date().getTime() / 1000
            }
        }
    }

    $rootScope.rawSend = function(address, satoshis, fee, url, aux, callback) {
        console.log('rawSend',address, satoshis, fee, url, aux);
        $rootScope.showMessage("generating transaction")
        var tx = gentx(address, satoshis, fee);
        console.log(Bitcoin.Script.createOutputScript(tx.outs[0].address));
        $rootScope.showMessage("sending");
        $http.post(url,_.extend(aux,{ tx: tx.serializeHex() }))
             .success(function(r) {
                 processtx(tx)
                 callback();
             })
             .error($rootScope.errHandle);
    }

    $rootScope.txouts = {};
    $rootScope.gettxouts = function(callback) {
        if (!$rootScope.user || !$rootScope.user.address) { return }
        $http.post('/addressoutputs', { address: $rootScope.user.address })
             .success(function(h) {
                h.map(function(hitem) {
                    if (!$rootScope.txouts[hitem.output]) {
                        $rootScope.txouts[hitem.output] = hitem;
                    }
                    if ($rootScope.txouts[hitem.output].pending)
                        $rootScope.txouts[hitem.output].pending = false;
                })
                var curtime = new Date().getTime() / 1000;
                $rootScope.balance = 0;
                $rootScope.unconfirmed = 0;
                for (var v in $rootScope.txouts) {
                    var out = $rootScope.txouts[v];
                    if (!out.pending && !out.spend) $rootScope.balance += out.value;
                    if (out.pending) $rootScope.unconfirmed += out.value
                    if (out.timestamp && out.timestamp < curtime - 600) {
                        delete $rootScope.txouts[v]
                    }
                }
                if (callback) callback();
             })
    }
    setInterval($rootScope.gettxouts,6667);
    $rootScope.gettxouts();

    $rootScope.buyTnx = function(amount,callback) {
        if (!parseInt(amount)) return
        $rootScope.checkBitcoinLoggedIn(function() {
            if ($rootScope.balance === null) {
                $rootScope.message = {
                    body: 'getting balance',
                    canceltext: 'cool thanx'
                }
                $rootScope.gettxouts(function() { $scope.buyTnx(amount) })
            }
            if ($rootScope.balance < amount + 10000) {
                return $rootScope.errHandle('not enough funds')
            }
            $http.get('/thanxaddress')
                .success(function(r) {
                    $rootScope.rawSend(r.address, amount, 10000, '/buytnx', {}, function() {
                        $rootScope.user.tnx += amount
                        callback()
                    })
                })
        })
    }

    $rootScope.thanxSend = function(toUser, tnx, request, message) {
        if ($rootScope.user.tnx >= tnx) {
            var body = 'are you sure you want to send '+toUser+' '+tnx+' tnx?'
            $rootScope.confirmDialog(body,function() {
                $http.post('/sendtnx',{
                    tnx: tnx,
                    to: toUser,
                    request: request ? request.id : null,
                    message: message || ((request && request.message) ? 'Re: '+request.message : '')
                })
                .success(function(r) {
                    $rootScope.message = { body: 'success', canceltext: 'cool thanx' }
                    $rootScope.user.tnx -= tnx;
                })
                .error(function(e) {
                    $rootScope.message = { body: 'failed sending ' + tnx + ' to user ' + toUser + ' error: ' + e, canceltext: 'close' }
                })

            })
            return
        }
        var shortfall = Math.max(10000,tnx - $rootScope.user.tnx)
        if ($rootScope.balance >= shortfall + 10000) {
            var body = 'you don\'t have enough tnx to give this many, but you certainly can convert some btc. do it now?'
            $rootScope.confirmDialog(body,function() {
                $rootScope.buyTnx(shortfall,function() {
                    $rootScope.thanxSend(toUser, tnx, request, message);
                })
            })
        }
        else {
            $rootScope.errHandle('you don\' have enough tnx or btc to give')
        }
    }

    $rootScope.checkBitcoinData = function() {
        $http.get('/price')
            .success(function(p) {
                $rootScope.price = parseFloat(p)
            })
        $http.get('/fetchheight')
            .success(function(h) {
                $rootScope.lastheight = parseInt(h)
            })
    }
    setInterval($rootScope.checkBitcoinData,6667);
    $rootScope.checkBitcoinData();
})
