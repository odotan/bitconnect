window.controllers.controller('GetController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', function($scope, $rootScope, $http, $location, me, requests, bitcoin) {

    window.wscope = $scope;

    $scope.get = {
        from: $location.search().from,
        tnx: $location.search().tnx,
        message: $location.search().message
    }

    $scope.gettnx = function() {
        if (!parseInt($scope.get.tnx)) return;
        $http.post('/mkrequest',{
            tnx: parseInt($scope.get.tnx),
            from: $scope.get.from,
            message: $scope.get.message
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'request sent!',
                canceltext: 'cool thanx'
            }
        })
        .error($rootScope.errHandle);
    }
    $scope.usernames = []
    $scope.$watch('get.from',function() {
        if (!$scope.get.from || $scope.get.from.length < 2) return;
        $http.get('/autofill?partial='+$scope.get.from)
             .success(function(r) {
                $scope.usernames = r
             })
    })
}])
