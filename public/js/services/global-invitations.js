window.app.service('GlobalInvitationsService', ['$rootScope', '$http', function($rootScope, $http) {
    function updateLimit() {
        $http.get('/globalinvitations').success(function(result) {
            $rootScope.usedInvitations = result.limit - result.remaining;
            $rootScope.invitationLimit = result.limit;
        });
    }
    updateLimit();
    setInterval(updateLimit, 10000);
}]);