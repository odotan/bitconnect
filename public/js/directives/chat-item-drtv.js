app.directive('chatItem', [

	function() {
		return {
			restrict: 'E',
			scope: {
				item: '='
			},
			replace: true,
			templateUrl: '/templates/chat-item-tmpl',
			controller: ['$scope', '$attrs', '$http', '$rootScope', 'RequestTypes', 'TxTypes',
				function ChatItemCtrl($scope, $attrs, $http, $rootScope, RequestTypes, TxTypes) {
					$scope.time = new Date($scope.item.timestamp * 1000);
					if (($scope.item.requestType && $scope.item.sender && $scope.item.sender.id === $rootScope.user.id) ||
						$scope.item.payer && $scope.item.payer.id === $rootScope.user.id) {
						$scope.direction = 'outgoing';
					} else {
						$scope.direction = 'incoming';
					}
					$scope.reject = function() {
						var request = $scope.request;
						$rootScope.message = {
							body: $scope.direction == 'incoming' ?
								'are you sure you want to reject?' : 'are you sure you want to cancel your request?',
							action: function() {
								$http.post('/clearrequest', {
									request_id: $scope.item.id
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
					$scope.accept = function accept() {
						var request = $scope.item;
						if (request.requestType === RequestTypes.GET) {
							if (!request) return;
							if (request.tnx > 0) {
								$rootScope.thanxSend(request.sender.username, request.tnx, request, request.message, TxTypes.getRequest);
							} else {
								$rootScope.bitcoinSend(request.sender.username, request.sat, null, request.message, request.id, function(err) {
									if (err) {
										$rootScope.errHandle(err);
									}
								});
							}
						} else if (request.requestType === RequestTypes.GIVE) {
							$rootScope.message = {
								body: 'get ' + request.tnx + ' thanx from ' + request.sender.username + '?',
								action: function() {
									$http.post('/acceptgive', {
										requestId: request.id
									}).success(function() {
										$rootScope.message = {};
									});
								},
								actiontext: 'yep',
								canceltext: 'nope'
							}
						}
					};
				}
			]
		}
	}
]);