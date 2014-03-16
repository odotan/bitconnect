window.controllers.controller('ProfileCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams', '$timeout', 'UsersService',
	function ($scope, $rootScope, $http, $location, $routeParams, $timeout, UsersService) {
		window.wscope = $scope;
		$scope.userId = $routeParams.userId;
		UsersService.getUserById($scope.userId, function(user) {
			$scope.user = user;
		});
		//$scope.username = window.location.host.split('.').slice(0,2).join('.')+'.bitconnect.me'
		$scope.give = function() {
			location.href="/app/give?toId=" + $scope.userId;
		};

		$scope.get = function() {
			location.href="/app/get?fromId=" + $scope.userId;
		};
	}
]);