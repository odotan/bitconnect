var db = require('./db'),
	constants = require('./constants'),
	util = require('./util'),
	mkrespcb = util.mkrespcb;
var m = module.exports = {};
var isActive;
setTimeout(function() {
	db.SystemParam.findOne({
		key: constants.SystemParamKeys.globalInvitations,
		'value.active': true
	}, function(err, value) {
		isActive = (!err || err === '') && value;
	});
}, 1000);

/**
 *	Returns true iff the system is currently limiting the number of invitations allowed.
 *	Updates only with server restart.
 */
m.isLimitActive = function isLimitActive() {
	return isActive;
}
/**
 *	Calls the given callback(err, res) with an object containing the global invitation limit,
 *	and the remaining number of invitations.
 *	Example:
 *	{
 *		limit: 32,
 *		remaining: 13
 *	}
 */
m.getInvitationStatus = function getInvitationStatus(callback) {
	db.SystemParam.findOne({
		key: constants.SystemParamKeys.globalInvitations
	}, callback);
};

m.getInvitationStatusResource = function getInvitationStatusResource(req, res) {
	return m.getInvitationStatus(mkrespcb(res, 400, function(param) {
		res.json(param.value);
	}));
};

/**
 *	Verifies that there are enough remaining invitations, and if so decrements the remaining
 *	invitations by the given value and calls the given callback(bool) with true value.
 *	Otherwise, calls the given callback with false value.
 */
m.verifyAndDecrement = function verifyAndDecrement(valueToDecrement, callback) {
	db.SystemParam.findAndModify({
		key: constants.SystemParamKeys.globalInvitations,
		'value.remaining': {
			$gte: valueToDecrement
		}
	}, {}, {
		$inc: {
			'value.remaining': -valueToDecrement
		}
	}, function(err, invitationStatus) {
		callback((!err || err === '') && invitationStatus);
	});
};