window.app.service('bitcoin', function($rootScope, $http) {
    $rootScope.bitcoinLogin = function(pw, callback, errback) {
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
        } else if ($rootScope.user) {
            $http.post('/submitaddress', {
                address: address
            })
                .success(success)
                .error(fail)
        } else $rootScope.errHandle("not logged in");
    }

    $rootScope.checkBitcoinLoggedIn = function(callback) {
        if (!$rootScope.user)
            return
        if ($rootScope.key)
            return callback();
        var fields = {
            'password': {
                type: 'password'
            }
        }
        if (!$rootScope.user.address)
            fields['confirm'] = {
                type: 'password'
            }
        $rootScope.message = {
            body: 'please enter password',
            fields: fields,
            canceltext: 'no thanx',
            action: function() {
                if (!$rootScope.user.address && $rootScope.message.fields.password.value != $rootScope.message.fields.confirm.value) {
                    $rootScope.message.body = 'passwords don\'t match, please try again'
                } else {
                    $rootScope.bitcoinLogin($rootScope.message.fields.password.value, function() {
                        $rootScope.message = null;
                        if (callback) callback();
                    }, function(e) {
                        $rootScope.message.body = e;
                    })
                }
            },
            actiontext: 'log me in'
        }
    }

    $rootScope.bitcoinSend = function(userWalletAddr, satoshis, fee, message, requestId, cb) {
        if (!fee) fee = 10000;
        satoshis = Math.ceil(satoshis);
        if (!$rootScope.key) {
            $rootScope.checkBitcoinLoggedIn(function() {
                $rootScope.bitcoinSend(userWalletAddr, satoshis, fee, message, requestId, cb);
            })
        } else if (!userWalletAddr) {
            cb('giving satoshi to whom?');
        } else if (satoshis < 5430) {
            cb('must send at least 5430 satoshis');
        } else if ($rootScope.balance < satoshis + fee) {
            cb('not enough balance!');
        } else if (userWalletAddr.indexOf('.') >= 0) {
            $http.get('/userdata?username=' + encodeURIComponent(userWalletAddr))
                .success(function(r) {
                    if (!r[0]) return cb('user not found');
                    if (!r[0].address) return cb('getter has no address');
                    $rootScope.message = {
                        body: 'send ' + satoshis + ' satoshi to ' + userWalletAddr + '?',
                        action: function() {
                            try {
                                $rootScope.rawSend(r[0].address, satoshis, fee, '/sendbtc', {
                                    to: userWalletAddr,
                                    message: message,
                                    requestId: requestId
                                }, function(err) {
                                    $rootScope.message = {};
                                    if(!err) {
                                        $rootScope.goto('thanx');
                                    }
                                    cb(err);
                                });
                            } catch (e) {
                                cb(e.toString());
                            }
                        },
                        actiontext: 'yep',
                        canceltext: 'nope'
                    };
                })
                .error(cb);
        } else try {
            $rootScope.rawSend(userWalletAddr, satoshis, fee, '/sendbtc', {
                message: message,
                to: userWalletAddr,
                requestId: requestId
            }, function(err) {
                if(!err) {
                    $rootScope.showMessage('success');
                }
                cb(err);
            })
        } catch (e) {
            $rootScope.message.body = e.toString();
        }
    }

    var gentx = function(address, satoshis, fee) {
        var utxo = get_enough_utxo_from_history($rootScope.txouts, satoshis + fee),
            needsplit = Object.keys($rootScope.txouts).length < 5 ? 1 : 2,
            change = _.range(needsplit).map(function(x) {
                return $rootScope.user.address
            }),
            tx = make_sending_transaction(utxo,
                address,
                satoshis,
                change,
                fee);

        for (var i = 0; i < tx.ins.length; i++) {
            tx.sign(i, $rootScope.key)
        }
        return tx;
    }

    var processtx = function(tx) {
        var txhash = tx.getHash()
        for (var i = 0; i < tx.outs.length; i++) {
            if (tx.outs[i].address == $rootScope.user.address) {
                $rootScope.txouts[txhash + ':' + i] = {
                    output: txhash + ':' + i,
                    value: tx.outs[i].value,
                    timestamp: new Date().getTime() / 1000,
                    pending: true
                }
            }
        }
        for (var i = 0; i < tx.ins.length; i++) {
            var op = tx.ins[i].outpoint
            var o = $rootScope.txouts[op.hash + ':' + op.index]
            if (o) {
                o.spend = true
                o.timestamp = new Date().getTime() / 1000
            }
        }
    }

    $rootScope.rawSend = function(address, satoshis, fee, url, aux, callback) {
        var tx = gentx(address, satoshis, fee);
        $http.post(url, _.extend(aux, {
            tx: tx.serializeHex()
        }))
            .success(function(r) {
                processtx(tx)
                callback();
            })
            .error(callback);
    }

    $rootScope.txouts = {};
    $rootScope.gettxouts = function(callback) {
        if (!$rootScope.user || !$rootScope.user.address) {
            return
        }
        $http.post('/addressoutputs', {
            address: $rootScope.user.address
        })
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
    setInterval($rootScope.gettxouts, 6667);
    $rootScope.gettxouts();

    $rootScope.buyTnx = function(amount, callback) {
        if (!parseInt(amount)) return
        $rootScope.checkBitcoinLoggedIn(function() {
            if ($rootScope.balance === null) {
                $rootScope.message = {
                    body: 'getting balance',
                    canceltext: 'cool thanx'
                }
                $rootScope.gettxouts(function() {
                    $scope.buyTnx(amount)
                })
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

    $rootScope.thanxSend = function(userWalletAddr, tnx, request, message, txType) {
        if ($rootScope.user.tnx >= tnx) {
            var body = 'send ' + tnx + ' thanx to ' + userWalletAddr + '?';
            $rootScope.confirmDialog(body, function() {
                $http.post('/sendtnx', {
                    tnx: tnx,
                    to: userWalletAddr,
                    request: request ? request.id : null,
                    txType: txType,
                    message: message || ((request && request.message) ? 'Re: ' + request.message : '')
                })
                    .success(function(r) {
                        $rootScope.message = {
                            body: 'success',
                            canceltext: 'cool, thanx'
                        }
                        $rootScope.user.tnx -= tnx;
                    })
                    .error(function(e) {
                        $rootScope.message = {
                            body: 'failed sending ' + tnx + ' to user ' + userWalletAddr + ' error: ' + e,
                            canceltext: 'close'
                        }
                    })

            })
            return
        }
        var shortfall = Math.max(10000, tnx - $rootScope.user.tnx)
        if ($rootScope.balance >= shortfall + 10000) {
            var body = 'you don\'t have enough thanx to give this many, but you certainly can convert some satoshi. do it now?'
            $rootScope.confirmDialog(body, function() {
                $rootScope.buyTnx(shortfall, function() {
                    $rootScope.thanxSend(userWalletAddr, tnx, request, message);
                })
            })
        } else {
            $rootScope.errHandle('you don\' have enough thanx or satoshi to give')
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
    setInterval($rootScope.checkBitcoinData, 6667);
    $rootScope.checkBitcoinData();
})