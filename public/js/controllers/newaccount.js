window.controllers.controller('NewAccountController', ['$scope', '$rootScope', '$http', '$window', 'me', function($scope, $rootScope, $http, $window, me) {

	window.wscope = $scope;

	$scope.checkname = function() {
		$http.post('/checkname', {
			name: $scope.username + '.bitconnect.me'
		})
			.success(function(r) {
				if (r == '"available"') $scope.available = true;
				else $scope.available = false;
			})
			.error(errhandle);
	}

	$scope.register = function() {
		$http.post('/register', {
			name: $scope.username + '.bitconnect.me'
		})
			.success(function(u) {
				$window.location.href = '/app/us';
			})
			.error(errhandle);
	}

	$scope.$watch('username', $scope.checkname)
}]);