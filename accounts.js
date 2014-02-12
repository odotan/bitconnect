var db = require('./db'),
	util = require('./util'),
	async = require('async'),
	_ = require('underscore'),
	https = require('https'),
	Bitcoin = require('bitcoinjs-lib'),
	constants = require('./constants'),
	config = require('./config');
var eh = util.eh,
	mkrespcb = util.mkrespcb,
	setter = util.cbsetter,
	pybtctool = util.pybtctool,
	FBify = util.FBify,
	dumpUser = util.dumpUser;

var m = module.exports = {}

// Register a new account
m.register = FBify(function(profile, req, res) {
	db.User.findOne({
		username: req.param('name')
	}, mkrespcb(res, 400, function(u) {
		if (u) return res.json('Account already exists', 400);
		console.log('registering');
		var newuser = {
			username: req.param('name'),
			fbUser: profile,
			id: profile.id,
			inviteCounter: 0,
			inviteAcceptedCounter: 0,
			seed: util.randomHex(40),
			verificationSeed: util.randomHex(20),
			friends: [],
			firstUse: true
		}
		db.User.insert(newuser, mkrespcb(res, 400, function() {
			db.FBInvite.find({
				to: profile.id,
			}).toArray(mkrespcb(res, 400, function(reqs) {
				console.log('requests found', reqs);
				consumeFBInvites(reqs, newuser, mkrespcb(res, 400, function() {
					console.log('registered');
					res.json(newuser);
				}));
			}));
		}));
	}));
});

// Consume outstanting Facebook requests when creating an account

var consumeFBInvites = function(reqs, to, cb) {
	async.map(reqs, function(req, cb2) {
		db.FBInvite.remove({
			reqid: req.reqid
		}, eh(cb2, function() {
			db.User.findOne({
				id: req.from
			}, cb2);
		}));
	}, eh(cb, function(users) {
		console.log('consuming invites from', users, 'to', to.fbUser ? to.fbUser.first_name : "undefined");
		// Uniquefy users
		var umap = {};
		users.map(function(u) {
			if (u) umap[u.id] = u
		});
		users = [];
		for (var uid in umap) users.push(umap[uid]);
		// Distribute thanx
		var reward = Math.floor(constants.Rewards.signupReward / users.length);
		async.map(users, function(user, cb2) {
			// Give to each inviting user
			console.log('giving to', user.fbUser.first_name, 'from', user.tnx, 'to', user.tnx + reward);

			var newCounter = (user.acceptedInviteCounter || 0) + (1 / users.length),
				newTnx = (user.tnx || 0) + reward;

			while (newCounter >= 10) {
				newCounter -= 10;
				newTnx += constants.Rewards.signupReward;
			}

			db.User.update({
				id: user.id
			}, {
				$set: {
					tnx: newTnx,
					acceptedInviteCounter: newCounter,
					friends: user.friends.concat([to.id])
				}
			}, eh(cb2, function() {
				db.Transaction.insert({
					payer: [to.id],
					payee: dumpUser(user),
					id: util.randomHex(32),
					tnx: newTnx - user.tnx,
					txType: "signupReward",
					timestamp: new Date().getTime() / 1000,
					message: to.fbUser.first_name + ' ' + to.fbUser.last_name + " signed up!"
				}, cb2)
			}))
		}, eh(cb, function() {
			// Clear all users with more than 10 in their counter score
			// Give to receiving user
			var userIds = users.map(function(u) {
				return u.id
			}),
				initialTnx = constants.Rewards.signupReward + reqs.length * constants.Rewards.inviteReward;
			db.User.update({
				id: to.id
			}, {
				$set: {
					tnx: initialTnx,
					friends: userIds
				}
			}, eh(cb, function() {
				db.Transaction.insert({
					payer: userIds,
					payee: dumpUser(to),
					id: util.randomHex(32),
					tnx: initialTnx,
					message: "a welcome gift",
					txType: "signupReward",
					timestamp: new Date().getTime() / 1000
				}, cb);
			}));
		}));
	}));
};


function getVerificationFqlQuery(profileId, invitedFriendIds) {
	var res = 'SELECT recipient_uid FROM apprequest WHERE app_id=' + config.FBappId + ' AND sender_uid=' + profileId + ' AND (',
		firstFriend = true;

	invitedFriendIds.forEach(function(friendId) {
		if (!firstFriend) {
			res += ' OR ';
		} else {
			firstFriend = false;
		}
		res += ' recipient_uid = ' + friendId;
	});
	res += ")";
	return res;
}

m.mkInvite = function(req, res) {
	req.facebook.api('/me', mkrespcb(res, 400, function(profile) {
		var bonus = 0;
		req.facebook.api({
			method: 'fql.query',
			query: getVerificationFqlQuery(profile.id, req.param('to'))
		}, function(err, verifiedInvitations) {
			var isVerified = {},
				verifiedUnique = [];
			verifiedInvitations.forEach(function(invitation) {
				if (isVerified[invitation.recipient_uid]) {
					return;
				}
				verifiedUnique.push(invitation.recipient_uid);
				isVerified[invitation.recipient_uid] = true;
			});

			async.map(verifiedUnique, function(to, cb) {
				var fbinvite = {
					from: profile.id,
					to: to,
					reqid: req.param('reqid')
				}
				db.FBInvite.findOne({
					from: profile.id,
					to: to
				}, mkrespcb(res, 400, function(r) {
					if (!r) {
						console.log('fbinvite added', fbinvite);
						bonus++;
						db.FBInvite.insert(fbinvite, cb);
					} else {
						console.log('fbinvite already exists')
						cb();
					}
				}));
			}, mkrespcb(res, 400, function() {
				db.User.findOne({
					id: profile.id
				}, mkrespcb(res, 400, function(u) {
					var newCounter = u.inviteCounter + bonus,
						newTnx = (u.tnx || 0) + bonus * constants.Rewards.inviteReward;

					while (newCounter >= 10) {
						newCounter -= 10;
						newTnx += constants.Rewards.inviteReward;
					}
					console.log('giving to', u.fbUser.first_name, 'from', u.tnx, 'to', newTnx);
					db.User.update({
						id: profile.id
					}, {
						$set: {
							tnx: newTnx,
							inviteCounter: newCounter,
							firstUse: false
						}
					}, mkrespcb(res, 400, function() {
						db.Transaction.insert({
							payer: [req.param('to').id],
							payee: dumpUser(u),
							id: util.randomHex(32),
							tnx: newTnx - u.tnx,
							txType: constants.TxTypes.inviteReward,
							message: "for inviting your friends to bitconnect!",
							timestamp: new Date().getTime() / 1000
						}, mkrespcb(res, 400, function() {
							console.log('fbinvites registered, bonus:', bonus);
							res.json({
								success: true,
								bonus: bonus
							});
						}))
					}));
				}));
			}));
		});
	}));
};

m.acceptInvite = function(req, res) {
	console.log('accessing from facebook');
	req.facebook.api('/me', mkrespcb(res, 400, function(profile) {
		var reqidStr = req.param('request_ids')
		var reqids = reqidStr ? reqidStr.split(',') : []
		console.log('reqids', reqids)
		var query = {
			reqid: {
				$in: reqids
			},
			to: profile.id
		}
		db.FBInvite.update(query, {
			$set: {
				accepted: true
			}
		}, mkrespcb(res, 400, function() {
			async.map(reqids, function(reqid, cb) {
				var full_reqid = reqid + '_' + profile.id;
				req.facebook.api('/' + full_reqid, 'delete', function(e, r) {
					cb(null, e || r);
				});
			}, mkrespcb(res, 400, function(results) {
				console.log('updated requests', results);
				res.render('welcome.jade', {})
			}));
		}));
	}));
};

m.kill = FBify(function(profile, req, res) {
	console.log('killing');
	db.User.findOne({
		id: profile.id
	}, mkrespcb(res, 400, function(u) {
		if (!u) return res.json("User not found", 400);
		db.User.remove({
			id: profile.id
		}, mkrespcb(res, 400, function() {
			db.User.find({}).toArray(mkrespcb(res, 400, function(users) {
				async.map(users, function(u, cb) {
					db.User.update({
						id: u.id
					}, {
						$set: {
							friends: (u.friends || []).filter(function(i) {
								return i != profile.id;
							})
						}
					}, mkrespcb(res, 400, function() {
						db.FBInvite.remove({
							$or: [{
								from: u.id
							}, {
								to: u.id
							}]
						}, cb);
					}));
				}, mkrespcb(res, 400, function() {
					res.json({
						username: null,
						fbUser: profile
					});
				}));
			}));
		}));
	}));
});

// Me

m.getMe = FBify(function(profile, req, res) {
	db.User.findOne({
		id: profile.id
	}, mkrespcb(res, 400, function(u) {
		if (u) res.json(u);
		else res.json({
			username: null,
			fbUser: profile
		});
	}));
});

// Get friendlist

m.getFriends = FBify(function(profile, req, res) {
	var scope = {}
	async.series([

		function(cb2) {
			req.facebook.api('/me/friends', {
				fields: 'id, first_name, last_name, picture'
			}, setter(scope, 'response', cb2))
		},
		function(cb2) {
			db.User.find({}).toArray(setter(scope, 'users', cb2))
		},
		function(cb2) {
			db.User.findOne({
				id: profile.id
			}, setter(scope, 'me', cb2))
		},
		function(cb2) {
			if (!scope.me) return res.json('me not found', 400);
			var friends = scope.response.data;
			var usermap = {}
			scope.users.map(function(u) {
				usermap[u.id] = u
			})
			var friendmap = {}
			friends.map(function(f) {
				friendmap[f.id] = f
			})
			friends.map(function(f) {
				if (usermap[f.id]) f.isUser = true
				if (friendmap[f.id]) f.isFriend = true
			})
			setter(scope, 'friends', cb2)(null, friends);
		}
	], mkrespcb(res, 400, function() {
		res.json(scope.friends)
	}))
});

// Autocomplete usernames

m.autoFill = function(req, res) {
	var partial = req.param('partial') || ''
	var names = partial.split(' ');
	var nameConditions = [{
		'fbUser.first_name': {
			$regex: '^' + names[0],
			$options: 'i'
		}
	}];
	if (names[1]) {
		nameConditions.push({
			'fbUser.last_name': {
				$regex: '^' + names[1],
				$options: 'i'
			}
		});
	}
	db.User.find({
		$or: [{
			username: {
				$regex: '^' + partial,
				$options: 'i'
			}
		}, {
			$and: nameConditions
		}]
	})
		.toArray(mkrespcb(res, 400, function(r) {
			res.json(r.map(function(x) {
				return {
					username: x.username,
					id: x.id,
					fullname: x.fbUser.first_name + " " + x.fbUser.last_name
				}
			}));
		}))
};

m.getUserById = function getUserById(req, res) {
	db.User.findOne({
		id: req.param('userId')
	}, mkrespcb(res, 400, function(u) {
		res.json({
			username: u.username,
			id: u.id,
			fullname: u.fbUser.first_name + " " + u.fbUser.last_name
		});
	}));
}

// Is a username available?

m.checkName = function(req, res) {
	db.User.findOne({
		username: req.param('name')
	}, mkrespcb(res, 400, function(u) {
		if (!u) res.json('available');
		else res.json('used');
	}));
};

m.getPic = function(req, res) {
	function getPicture(userId) {
		req.facebook.api('/' + userId + '/picture?width=' + sz + '&height=' + sz + '&redirect=false', mkrespcb(res, 400, function(pic) {
			var extension = pic.data.url.slice(pic.data.url.length - 3)
			https.get(pic.data.url, function(r) {
				res.writeHead(200, {
					'Content-Type': 'image/' + extension
				});
				r.pipe(res);
			})
		}));
	}
	var username = req.param('username'),
		userId = username && undefined || req.param('id'),
		sz = parseInt(req.param('size')) || 50;
	if (username) {
		db.User.findOne({
			username: username
		}, mkrespcb(res, 400, function(u) {
			if (!u) {
				return res.json("user not found", 404)
			}
			return getPicture(u.id);
		}));
	} else if (userId) {
		return getPicture(userId);
	}
}

// Return verification table

m.printVerificationTable = function(req, res) {
	db.User.find().toArray(mkrespcb(res, 400, function(users) {
		var twoToThe128 = new Bitcoin.BigInteger.fromByteArrayUnsigned([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
			counter = new Bitcoin.BigInteger('0');

		var usertable = users.map(function(u) {
			var vsBytes = Bitcoin.convert.hexToBytes(u.verificationSeed || '00000000000000000000'),
				offset = new Bitcoin.BigInteger.fromByteArrayUnsigned(vsBytes),
				key = new Bitcoin.BigInteger('' + u.tnx).multiply(twoToThe128).add(offset),
				pub = Bitcoin.convert.bytesToHex(new Bitcoin.Key(key).getPub());
			counter = counter.add(key);
			return {
				vsHash: Bitcoin.Crypto.SHA256(u.verificationSeed),
				pubkey: pub
			}
		})
		res.json({
			total: counter.toString(),
			users: usertable
		})
	}))
}

m.printMyVerificationSeed = FBify(function(profile, req, res) {
	db.User.findOne({
		id: profile.id
	}, mkrespcb(res, 400, function(u) {
		if (u) res.send(u.verificationSeed || '00000000000000000000');
		else res.json("No user found", 400)
	}))
})