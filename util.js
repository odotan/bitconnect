var crypto = require('crypto');
    
var eh = function(fail, success) {
    return function(err, res) {
        if (err) {
            console.log('e',err,'f',fail,'s',success);
            if (fail) { fail(err); }
        }
        else {
            success.apply(this,Array.prototype.slice.call(arguments,1));
        }
    };
};

var mkrespcb = function(res,code,success) {
    return eh(function(msg) { res.json(msg,code);  },success);
}

var entropy = ''+new Date().getTime()+Math.random();

crypto.randomBytes(100,function(err,buf) {
    if (err) { throw err; }
    entropy += buf.toString('hex');
});

var random = function(modulus) {
    var alphabet = '0123456789abcdef';
    return sha256(entropy+new Date().getTime()+Math.random()).split('')
           .reduce(function(tot,x) {
                return (tot * 16 + alphabet.indexOf(x)) % modulus;
           },0);
}

module.exports = {
    eh: eh,
    mkrespcb: mkrespcb,
    random: random
}
