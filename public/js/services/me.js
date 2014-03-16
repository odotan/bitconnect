window.app.service('me', function($rootScope, $http) {

	window.rscope = $rootScope;

	this.getme = function() {
		$http.get('/me')
			.success(function(u) {
				if (!angular.equals(u, $rootScope.user)) {
					$rootScope.user = u;
					$rootScope.firstname = $rootScope.user.fbUser.first_name.toLowerCase();
					$rootScope.lastname = $rootScope.user.fbUser.last_name.toLowerCase();
					$rootScope.username = $rootScope.user.fbUser.username ? $rootScope.user.fbUser.username : $rootScope.firstname + $rootScope.lastname;
				}
			})
			.error(function(e) {
				console.log(e);
				if (e.result && e.result.error && e.result.error.code == 2500) {
					$rootScope.user = {};
					window.location.href = '/';
				}
			});
	};
	setInterval(this.getme, 5000);
	this.getme();
});