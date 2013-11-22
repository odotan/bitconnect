// These are so often used....

var h2b = Bitcoin.convert.hexToBytes,
    b2h = Bitcoin.convert.bytesToHex;

// Crypto primitives

var make_sending_transaction = function(utxo, to, value, change, fee) {
    if (!fee) fee = 10000
    var sum = utxo.map(function(x) { return x.value; })
                  .reduce(function(a,b) { return a+b; },0),
        outputs = [{
            address: to,   
            value: value
        }]
    if (value < 5430) { throw new Error("Amount below dust threshold!"); }
    if (sum < value) { throw new Error("Not enough money!"); }
    if (sum-value < fee) { throw new Error("Not enough to pay" + (fee / 100000000) + "BTC fee!"); }

    // Split change in half by default so that the wallet has multiple UTXO at all times
    if (typeof change == "string") change = [change, change];

    var changelen = Math.min(change.length,Math.floor((sum-value-fee) / 5430));

    for (var i = 0; i < changelen; i++) {
        outputs.push({ 
            address: change[i],
            value: Math.floor((sum-value-fee)/changelen) 
        });
    }
    return new Bitcoin.Transaction({
        ins: utxo.map(function(x) { return x.output }),
        outs: outputs
    })
}

// Get sufficient unspent transaction outputs from a history set to
// spend a given amount of money

var get_enough_utxo_from_history = function(h,amount,cb) {
    if (h.constructor != [].constructor) {
        var o = []
        for (var v in h) o.push(h[v])
        h = o;
    }
    var utxo = h.filter(function(x) { return !x.spend });
    var valuecompare = function(a,b) { return a.value > b.value; }
    var high = utxo.filter(function(o) { return o.value >= amount; }).sort(valuecompare);
    if (high.length > 0) return [high[0]];
    utxo.sort(valuecompare);
    var totalval = 0;
    for (var i = 0; i < utxo.length; i++) {
        totalval += utxo[i].value;
        if (totalval >= amount) return utxo.slice(0,i+1);
    }
    throw ("Not enough money to send funds including transaction fee. Have: "
                 + (totalval / 100000000) + ", needed: " + (amount / 100000000));
}
