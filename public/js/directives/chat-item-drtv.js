window.app.directive('chatItem', [

	function() {
		return {
			restrict: 'E',
			scope: {
				item: '='
			},
			replace: true,
			templateUrl: '/templates/chat-item-tmpl',
			controller: ['$scope', '$rootScope', 'requests', 'RequestTypes',
				function ChatItemCtrl($scope, $rootScope, requests, RequestTypes) {
					$scope.time = new Date($scope.item.timestamp * 1000);
					if (angular.isDefined($scope.item.sender) && $scope.item.sender.id === $rootScope.user.id) {
						$scope.direction = 'outgoing';
					} else {
						$scope.direction = 'incoming';
					}
					$scope.isLoss = (angular.isDefined($scope.item.payer) && $scope.item.payer.id === $rootScope.user.id)
					|| ($scope.item.requestType === RequestTypes.GET && $scope.direction==='incoming')
					|| ($scope.item.requestType === RequestTypes.GIVE && $scope.direction==='outgoing');
					$scope.isGain = (angular.isDefined($scope.item.payee) && $scope.item.payee.id === $rootScope.user.id) ||
					($scope.item.requestType === RequestTypes.GIVE && $scope.direction==='incoming') ||
					($scope.item.requestType === RequestTypes.GET && $scope.direction==='outgoing');
					$scope.isPending = $scope.item.requestType && !$scope.item.rejected && !$scope.item.cancelled;
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