app.directive('historyItem', ['$location', '$timeout', 'TxTypes',
function($location, $timeout, TxTypes) {
	return {
		restrict: 'E',
		scope: {
			item: '=',
			otherUser: '='
		},
		template: '<img ng-if="item.txType != \''+TxTypes.inviteReward+'\' && item.txType != \''+TxTypes.signupReward+'\' && otherUser.fbUser" ng-src="/pic?username={{otherUser.username}}&size=100" width="50px" height="50px" class="friendImg"/>' +
			'<img ng-if="item.txType != \''+TxTypes.inviteReward+'\' && item.txType != \''+TxTypes.signupReward+'\' && !otherUser.fbUser && otherUser" ng-src="https://en.bitcoin.it/w/images/en/2/29/BC_Logo_.png" width="50px" height="50px" class="friendImg"/>' +
			'<img ng-if="item.txType == \''+TxTypes.inviteReward+'\' || item.txType == \''+TxTypes.signupReward+'\'" ng-src="{{ item.tnx ? \'/img/x.svg\' : \'/img/s.svg\'}}" width="50px" height="50px" class="friendImg"/>' +
			'<div class="body" ng-class="{cancelled: item.cancelled || item.rejected}">' +
			'<div ng-if="item.txType != \''+TxTypes.inviteReward+'\' && item.txType != \''+TxTypes.signupReward+'\'" title="{{otherUser.username}}" ng-class="{realUser: otherUser.fbUser}" class="fbname" ng-click="goToUserPage()">{{ otherUser.fbUser ? otherUser.fbUser.first_name + \'  \'+ otherUser.fbUser.last_name : otherUser}}</div>' +
			'<div ng-if="item.txType == \''+TxTypes.inviteReward+'\' || item.txType == \''+TxTypes.signupReward+'\'" title="Reward" class="fbname">reward</div>' +
			'<div ng-if="item.tnx" class="tnx">{{otherUser == item.payer ? \'+\' : \'-\' }}{{ item.tnx }} thanx</div>' +
			'<div ng-if="item.sat" class="sat">{{otherUser == item.payer ? \'+\' : \'-\' }}{{ item.sat }} satoshi</div>' +
			'<div ng-if="item.message && !(item.rejected || item.cancelled)" class="message">{{ item.message.slice(0,200) }}</div>' +
			'<div ng-if="item.rejected" class="message">this request was rejected</div>' +
			'<div ng-if="item.cancelled" class="message">this request was cancelled</div>' + 
			'</div>',
		controller: ['$scope', '$rootScope', function($scope, $rootScope) {
			$scope.goToUserPage = function goToUserPage() {
				if ($scope.otherUser.fbUser) {
					$rootScope.goto('chat/' + $scope.otherUser.id);
				}
			}
		}],
		link: function linkFn(scope, element) {
			$timeout(function() {
				jQuery(angular.element(element)).find('.friendImg').draggable({
					axis: 'x',
					containment: element.parent(),
					drag: function(event, ui) {
						if (ui.position.left > 550) {
							//$("#well").fadeOut();
						}
					},
					stop: function(event, ui) {
						if (ui.position.left < angular.element(element.parent()).width() - angular.element(this).width() - 4) {
							jQuery(this).animate({
								left: "-2px"
							});
						} else {
							$location.path('/app/transaction/' + scope.item.id);
						}
					}
				});
			});
		}
	};
}]);