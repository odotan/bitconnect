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
						$scope.item.txid && $scope.item.payee && $scope.item.payee.id === $rootScope.user.id) {
						$scope.direction = 'outgoing';
					}
					else {
						$scope.direction = 'incoming';
					}
				}
			]
		};
	}
]);