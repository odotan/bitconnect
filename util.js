var crypto = require('crypto'),
    cp = require('child_process'),
    Facebook = require('facebook-node-sdk'),
    config = require('./config'),
    sha256 = function(x) {
        return crypto.createHash('sha256').update(x).digest('hex')
    };
/*
 * Returns a callback function(err, res) that in case of error runs given fail function,
 * otherwise runs given success function with results as argument.
 */
var eh = function(fail, success) {
    return function(err, res) {
        if (err) {
            console.log('e', err, 'f', fail, 's', success);
            if (fail) {
                fail(err);
            }
        } else {
            // calls success callback with result as argument
            success.apply(this, Array.prototype.slice.call(arguments, 1));
        }
    };
};
/*
 * Returns a callback function(err, results) that in case of error writes http error with given code to given response.
 * Otherwise runs given success function with results as argument.
 */
var mkrespcb = function(res, code, success) {
    return eh(function(msg) {
        res.json(msg, code);
    }, success);
}

var entropy = '' + new Date().getTime() + Math.random();

crypto.randomBytes(100, function(err, buf) {
    if (err) {
        throw err;
    }
    entropy += buf.toString('hex');
});

var random = function(modulus) {
    var alphabet = '0123456789abcdef';
    return sha256(entropy + new Date().getTime() + Math.random()).split('')
        .reduce(function(tot, x) {
            return (tot * 16 + alphabet.indexOf(x)) % modulus;
        }, 0);
}

var randomHex = function(b) {
    return sha256(entropy + new Date().getTime() + Math.random()).substring(0, b)
}

var cbsetter = function(obj, prop, callback) {
    return function(err, val) {
        if (err) callback(err);
        else {
            obj[prop] = val;
            callback(null, val);
        }
    }
}

var FBify = function(c) {
    return function(req, res) {
        req.facebook.api('/me', mkrespcb(res, 400, function(profile) {
            if (profile && profile.error)
                return res.json(profile.error, 404);
            c(profile, req, res);
        }));
    }
}

var facebook = new Facebook({
    appID: config.FBappId,
    secret: config.FBsecret
});

var pybtctool = function(command, argz) {
    var cb = arguments[arguments.length - 1]
    args = Array.prototype.slice.call(arguments, 1, arguments.length - 1)
        .map(function(x) {
            return ('' + x).replace('\\', '\\\\').replace(' ', '\\ ')
        })
    cp.exec('pybtctool ' + command + ' ' + args.join(' '), cb);
}

// Commands:
// trie('insert',old_state_id,key,val) -> new state_id updated with the (key,val) pair
// trie('insert','',key,val) -> new state_id with just the (key,val) pair
// trie('get',state_id,key) -> gets the value at that key at that state id
// Idea:
// To make atomic transactions, first run through the sequence of state changes using
// the trie insert function, and then change the reference to the state root in your
// other database
var trie = function(command, argz) {
    var cb = arguments[arguments.length - 1]
    args = Array.prototype.slice.call(arguments, 1, arguments.length - 1)
        .map(function(x) {
            return ('' + x).replace('\\', '\\\\').replace(' ', '\\ ')
        })
    cp.exec('./trie.py ' + command + ' /tmp/trie_database ' + args.join(' '), cb);
}

var dumpUser = function(u) {
    return {
        id: u.id,
        username: u.username,
        fbUser: u.fbUser ? {
            first_name: u.fbUser.first_name,
            last_name: u.fbUser.last_name,
        } : {}
    }
}


module.exports = {
    eh: eh,
    mkrespcb: mkrespcb,
    random: random,
    randomHex: randomHex,
    cbsetter: cbsetter,
    FBify: FBify,
    facebook: facebook,
    pybtctool: pybtctool,
    dumpUser: dumpUser
}
