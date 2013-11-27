function HistoryCtrl($scope, $rootScope, $http, $location, me, requests) {

    window.wscope = $scope;

    this.gethistory = function() {
        $http.get('/rawhistory')
            .success(function(h) { 
                // Do the object equality check so that we do not refresh unless we have to
                var newh = h.map(function(x) { return x.id }),
                    oldh = ($scope.history || []).map(function(x) { return x.id });
                if (JSON.stringify(newh) != JSON.stringify(oldh)) {
                    $scope.history = h
                    if (!$scope.$$phase) $scope.$apply();
                };
             })
    }
    setInterval(this.gethistory,5000);
    this.gethistory();
};
