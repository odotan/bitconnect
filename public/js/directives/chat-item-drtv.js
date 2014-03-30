window.app.directive('chatItem', [

	function() {
		return {
			restrict: 'E',
			scope: {
				item: '='
			},
			replace: true,
			templateUrl: '/templates/chat-item-tmpl',
			controller: ['$scope', '$rootScope', 'requests',
				function ChatItemCtrl($scope, $rootScope, requests) {
					$scope.time = new Date($scope.item.timestamp * 1000);
					if (($scope.item.requestType && $scope.item.sender && $scope.item.sender.id === $rootScope.user.id) ||
						$scope.item.payer && $scope.item.payer.id === $rootScope.user.id) {
						$scope.direction = 'outgoing';
					} else {
						$scope.direction = 'incoming';
					}
					$scope.reject = function() {
						requests.rejectRequest($scope.item, $scope.direction);
					};

					$scope.accept = function accept() {
						requests.acceptRequest($scope.item);
					};
				}
			]
		};
	}
]);