window.controllers.controller('NewAccountController', ['$scope', '$rootScope', '$http', '$window', '$timeout', 'me',
	function($scope, $rootScope, $http, $window, $timeout, me) {

		window.wscope = $scope;

		$scope.checkname = function() {
			$scope.legal = /^[a-zA-Z][0-9a-zA-Z_-]*$/.test($scope.username);
			$http.post('/checkname', {
				name: $scope.username + '.bitconnect.me'
			})
				.success(function(r) {
					if (r == '"available"') $scope.available = true;
					else $scope.available = false;
				})
				.error(errhandle);
		};

		$scope.register = function() {
			if (angular.isUndefined($scope.username) || !/^[a-zA-Z][0-9a-zA-Z_-]{3,15}$/.test($scope.username)) {
				return;
			}
			$http.post('/register', {
				name: $scope.username + '.bitconnect.me'
			})
				.success(function(u) {
					$window.location.href = '/app/us';
				})
				.error(errhandle);
		};

		$scope.checkShort = function() {
			console.log($scope.username);
			$scope.short = $scope.username && $scope.username.length < 4;
		};

		$scope.$watch('username', function(value) {
			$scope.checkname(value);
		});
		$scope.legal = true;
		$scope.available = true;
	}
]);