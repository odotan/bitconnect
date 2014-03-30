window.app.directive('requestItem', [

	function() {
		return {
			restrict: 'E',
			scope: {
				request: '=',
				direction: '@dir'
			},
			template: '<img ng-src="/pic?username={{ other.username }}&amp;size=100" width="50px" height="50px" class="friendImg"/>' +
				'<div class="body">' +
				'<div title="{{other.username}}" class="fbname realUser" ng-click="goToUserPage()">{{ other.fbUser.first_name }} {{ other.fbUser.last_name }}</div>' +
				'<div ng-if="request.tnx" class="tnx">{{ request.tnx | number:0 }} thanx</div>' +
				'<div ng-if="request.sat" class="sat">{{ request.sat | number:0 }} satoshi</div>' +
				'<div ng-if="request.message" class="message">{{ request.message }}</div>' +
				'</div>' +
				'<div class="rightButtons">' +
				'<span ng-switch="" ng-if="direction == \'incoming\'" on="request.requestType" class="accept">' +
				'<img ng-switch-when="GIVE" src="/img/get.png" ng-click="accept()" class="requestActionButton"/>' +
				'<img ng-switch-when="GET" src="/img/give.png" ng-click="accept()" class="requestActionButton"/>' +
				'</span>' +
				'<span class="reject">' +
				'<img src="/img/reject_blue.png" ng-click="reject()" class="requestActionButton"/></span>' +
				'</div>',
			controller: ['$scope', '$attrs', '$http', '$rootScope', 'requests', 'RequestTypes', 'TxTypes',
				function RequestItemCtrl($scope, $attrs, $http, $rootScope, requests, RequestTypes, TxTypes) {
					$scope.other = $scope.direction == 'outgoing' ? $scope.request.recipient : $scope.request.sender;

					$scope.accept = function() {
						requests.acceptRequest($scope.request, function() {
							$rootScope.goTo('thanx');
						});
					};

					$scope.reject = function() {
						requests.rejectRequest($scope.request, $scope.direction);
					};

					$scope.goToUserPage = function goToUserPage() {
						if($scope.other.fbUser) {
							$rootScope.goTo('chat/' + $scope.other.id);
						}
					};
				}
			]
		};
	}
]);