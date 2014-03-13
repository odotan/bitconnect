'use strict';
describe('services', function() {
	var history = [{
		"output": "A:1",
		"spend": "B:1",
		"value": 50000,
		"address": "1GuKkEx7YJd6Tkuq5CQWYJbqeidECnpFM1"
	}, {
		"output": "B:2",
		"value": 60000,
		"address": "1GuKkEx7YJd6Tkuq5CQWYJbqeidECnpFM1"
	}, {
		"output": "C:1",
		"spend": "B:3",
		"value": 20000,
		"address": "1GuKkEx7YJd6Tkuq5CQWYJbqeidECnpFM1"
	}, {
		"output": "D:1",
		"value": 10000,
		"address": "1GuKkEx7YJd6Tkuq5CQWYJbqeidECnpFM1"
	}];
	var history2 = [{
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 23860000,
		"output": "46586d621e838dd46edbf836a7e0df8d27c18e2e9be919424f8b8429b69b3b68:1"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 12100000,
		"output": "7be8b3f672b0744cf8d1d1bf0fb813378393f450d887f3b3ae527bd5dd11a25c:1"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 49300000,
		"output": "269c5f23a6f9f76956499c546e76a6576ae0414c13c67a1453e1b6c62fa5b945:0"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 12450000,
		"output": "afe04982c52146a9abc1cf5f21b45c51020ba21ec3063ebb84726827072cf3e3:1",
		"spend": "db47a825f266fd66aeda84cfdf2d277da09882fccfc808dac0255fc88c560d51:11"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 31500000,
		"output": "51a4758dab1f92506429fa16bb8ebddc9d9ca1dd4945cbb5543e4b4248e29920:0",
		"spend": "db47a825f266fd66aeda84cfdf2d277da09882fccfc808dac0255fc88c560d51:19"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 19006147,
		"output": "3cda8bcd41031521ad4032f084b8f13bd1f014f732f6fac123bafd74b9725a90:1",
		"spend": "db47a825f266fd66aeda84cfdf2d277da09882fccfc808dac0255fc88c560d51:18"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 11190000,
		"output": "804bd7e1278c8e19b5629d5033eb56afbf681fbd33c4a452c5ca9d0b6aedf4d0:0",
		"spend": "db47a825f266fd66aeda84cfdf2d277da09882fccfc808dac0255fc88c560d51:6"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 11200000,
		"output": "1de78fc0f054f7c4ded32b435652ce07a35aa0beb0b1dc065d48d3db65290aae:0",
		"spend": "db47a825f266fd66aeda84cfdf2d277da09882fccfc808dac0255fc88c560d51:3"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 36700000,
		"output": "f8eb8701d139ecbb6d7e0a4c7d4c5d5dcfc631eb6907ed6dfea3a0db990764da:1",
		"spend": "84f6f4026adbfdbb1d7bd7381f9c1b65d2a739025c01d0a5f5d66aefb3099259:3"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 54100000,
		"output": "d5b1a0aef8041cf551f7c87a5b94cb53fbfc143e0f929bf72cd74c15c9f5e1d5:0",
		"spend": "21cc695c0cd5fcb045424a6b5e4939230da952071ef4f11d084f22af3f5cc45c:13"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 35400000,
		"output": "e2f7a42228de7752bce8c75007aae9ad1f6e40089b6c200f64ead122d7c5c83f:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:7"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 3730000,
		"output": "eccb3c44cf43d4f185f8341a19d8071967a7f2fddc4be42c5f4f6097b7132fe6:1",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:21"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 3140000,
		"output": "19e6dbb693ce61b8354acfbcddf21d3e43582129fb49077af7238be12a20271c:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:5"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 23400000,
		"output": "bc6886368bd82be9f15f2326d7f4c9b253c0a1c97099faa2c08f65b31fbcc250:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:6"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 19500000,
		"output": "438a97acd95426454160ef602eab56ba5e57d9b2179b65a10e2ef46fb382aa70:1",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:12"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 3880000,
		"output": "f8e2513104bbc34a037e6708a16ac7fd3bc8705a35b71d5122f896e0ed66638e:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:24"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 9100000,
		"output": "3c82fe0c101629fad72ca1b13c1cf6858fa429467ad78282766de98784f9ee9c:1",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:9"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 9000000,
		"output": "18bc6bb84d109ebf432d5177c17d1604b59e9cd8d16dc392f5d964ffeb1e6df4:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:15"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 16200068,
		"output": "99bf1c521d69d64b8b3fe2498d6dc519f9299a8e1eaf17e8097017ca23bd0d59:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:8"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 11600000,
		"output": "edf58f0d5260eb772bb8c8703bc4a7d8f8c9b230af4114b63b156fe5dc797c22:0",
		"spend": "a9e217196db37d05846477223e1f6d946f178e95322fc537d4af5b402a446038:11"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 500000,
		"output": "03f6d2785c072d89834a273cc0db12eaa9b77121b2c8cf676e9689effb62c530:0"
	}];
	var utxo = [{
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 23860000,
		"output": "46586d621e838dd46edbf836a7e0df8d27c18e2e9be919424f8b8429b69b3b68:1"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 12100000,
		"output": "7be8b3f672b0744cf8d1d1bf0fb813378393f450d887f3b3ae527bd5dd11a25c:1"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 49300000,
		"output": "269c5f23a6f9f76956499c546e76a6576ae0414c13c67a1453e1b6c62fa5b945:0"
	}, {
		"address": "18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP",
		"value": 500000,
		"output": "03f6d2785c072d89834a273cc0db12eaa9b77121b2c8cf676e9689effb62c530:0"
	}];
	var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

	describe('bitcoinjs-wrapper', function() {
		it('get_enough_utxo_from_history should find high unspent tx output', function() {
			// try to spend 8000:
			var result = get_enough_utxo_from_history(history, 8000);
			expect(result[0].value).toBe(10000);
			expect(result.length).toBe(1);

			// try to spend 15000:
			result = get_enough_utxo_from_history(history, 15000);
			expect(result[0].value).toBe(60000);
			expect(result.length).toBe(1);
		});

		it('get_enough_utxo_from_history should fail if not enough money', function() {
			expect(function() {
				var result = get_enough_utxo_from_history(history, 72000);
			}).toThrow("Not enough money to send funds including transaction fee. Have: 0.0007, needed: 0.00072");
		});

		it('get_enough_utxo_from_history should combine two unspent outputs if one is not enough', function() {
			var result = get_enough_utxo_from_history(history, 65000);
			expect(result.length).toBe(2);
			var outputValues = result.map(function(o) {
				return o.value;
			});
			expect(outputValues).toContain(10000);
			expect(outputValues).toContain(60000);
		});

		it('get_enough_utxo_from_history should find high unspent tx output with complex history', function() {
			var result = get_enough_utxo_from_history(history2, 250000);
			expect(result.length).toBe(1);
			expect(result[0].value).toBe(500000);

			result = get_enough_utxo_from_history(history2, 1000000);
			expect(result.length).toBe(1);
			expect(result[0].value).toBe(12100000);
		});


		it('get_enough_utxo_from_history should combine unspent outputs if one is not enough on complex history', function() {
			var result = get_enough_utxo_from_history(history2, 50000000);
			expect(result.length).toBe(4);
			var outputValues = result.map(function(o) {
				return o.value;
			});
			expect(outputValues).toContain(23860000);
			expect(outputValues).toContain(12100000);
			expect(outputValues).toContain(500000);
			expect(outputValues).toContain(49300000);
		});

		it('get_enough_utxo_from_history should fail if not enough money on complex history', function() {
			expect(function() {
				var result = get_enough_utxo_from_history(history2, 90000000);
			}).toThrow("Not enough money to send funds including transaction fee. Have: 0.8576, needed: 0.9");
		});

		it('make_sending_transaction should create correct sending transaction', function() {
			var result = make_sending_transaction([utxo[3]], '1BcjEEPzhkPZZF9dRMVNs27N4zx4WxzF5M', 250000, '18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP', 10000);
			expect(result.outs.length).toBe(3);
			expect(result.outs[0].value).toBe(250000);
			var sum = 0;
			result.outs.forEach(function(o) {
				sum += o.value;
			});
			expect(sum).toBe(490000);
		});

		it('make_sending_transaction should create correct sending transaction with big amount', function() {
			var result = make_sending_transaction(utxo, '1BcjEEPzhkPZZF9dRMVNs27N4zx4WxzF5M', 50000000, '18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP', 10000);
			expect(result.outs.length).toBe(3);
			expect(result.outs[0].value).toBe(50000000);
			var sum = 0;
			result.outs.forEach(function(o) {
				sum += o.value;
			});
			expect(sum).toBe(85760000 - 10000);
		});

		it('should not create transaction for amount less than 5430', function() {
			expect(function() {
				var result = make_sending_transaction(utxo, '1BcjEEPzhkPZZF9dRMVNs27N4zx4WxzF5M', 5429, '18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP', 10000);
			}).toThrow('Amount below dust threshold!');
		});

		it('make_sending_transaction should not create transaction if given utxo is not enough', function() {
			expect(function() {
				var result = make_sending_transaction([utxo[3]], '1BcjEEPzhkPZZF9dRMVNs27N4zx4WxzF5M', 600000, '18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP', 10000);
			}).toThrow('Not enough money!');
		});

		it('make_sending_transaction should not create transaction if given utxo is not enough including fee', function() {
			expect(function() {
				var result = make_sending_transaction([utxo[3]], '1BcjEEPzhkPZZF9dRMVNs27N4zx4WxzF5M', 500000, '18mHiyfY9yaHq3WNb9dEFv7pjnpLfH7ZqP', 10000);
			}).toThrow('Not enough to pay 0.0001BTC fee!');
		});
	});
});