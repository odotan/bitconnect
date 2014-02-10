app.directive('requestItem', [function() {
		return {
			restrict: 'E',
			scope: {
				request: '=',
				direction: '@dir'
			},
			template: '<img ng-src="/pic?username={{ other.username }}&amp;size=100" width="50px" height="50px" class="friendImg"/>' +
				'<div class="body">' +
				'<div title="{{other.username}}" class="fbname">{{ other.fbUser.first_name }} {{ other.fbUser.last_name }}</div>' +
				'<div ng-if="request.tnx" class="tnx">{{ request.tnx }} thanx</div>' +
				'<div ng-if="request.sat" class="sat">{{ request.sat }} satoshi</div>' +
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
			controller: ['$scope', '$attrs', '$http', '$rootScope', 'RequestTypes', 'TxTypes',
				function RequestItemCtrl($scope, $attrs, $http, $rootScope, RequestTypes, TxTypes) {
					// TODO change incoming to constant
					$scope.other = $scope.direction == 'outgoing' ? $scope.request.recipient : $scope.request.sender;
				
					$scope.accept = function() {
						var request = $scope.request;
						if (request.requestType === RequestTypes.GET) {
							if (!request) return;
							if (request.tnx > 0) {
								$rootScope.thanxSend(request.sender.username, request.tnx, request, request.message, TxTypes.getRequest);
							} else {
								$rootScope.bitcoinSend(request.sender.username, request.sat, null, request.message, request.id);
							}
						} else if (request.requestType === RequestTypes.GIVE) {
							$http.post('/acceptgive', {
								requestId: request.id
							});
						}
						//TODO: clear handled requests
					};

					$scope.reject = function() {
						var request = $scope.request;
						$rootScope.message = {
							body: $scope.direction == 'incoming' ?
							'are you sure you want to reject?' :
							'are you sure you want to cancel your request?',
							action: function() {
								$http.post('/clearrequest', {
									request_id: request.id
								})
									.success(function() {
										$rootScope.message = {
											body: $scope.direction == 'incoming' ? 'rejected' : 'cancelled',
											canceltext: 'cool thanx'
										}
									})
									.error(function(e) {
										$rootScope.message = {
											body: e,
											canceltext: 'cool thanx'
										}
									})
							},
							actiontext: 'yep',
							canceltext: 'nope'
						}
					};
				}
			]
		};
	}
]);