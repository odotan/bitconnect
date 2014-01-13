window.controllers.controller('ProfileCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams', '$timeout', 'UsersService',
	function ($scope, $rootScope, $http, $location, $routeParams, $timeout, UsersService) {
		window.wscope = $scope;
		$scope.userId = $routeParams.userId;
		UsersService.getUserById($scope.userId, function(user) {
			$scope.user = user;
		});
		//$scope.username = window.location.host.split('.').slice(0,2).join('.')+'.bitconnect.me'
		$scope.give = function() {
			$rootScope.goto('give', {to: $scope.user});
		}

		$scope.get = function() {
			$rootScope.goto('get', {from: $scope.user});
		}

	}
]);