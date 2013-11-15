function NewAccountCtrl($scope, $rootScope, $http, $location, me) {

    window.wscope = $scope;

    $scope.checkname = function() {
        $http.post('/checkname',{ name:$scope.firstname+'.'+$scope.lastname })
            .success(function(r) {
                if (r == '"available"') $scope.available = true;
                else $scope.available = false;
             })
            .error(errhandle);
    }

    $scope.register = function() {
        $http.post('/register',{ name:$scope.firstname+'.'+$scope.lastname })
            .success(function(u) {
                $rootScope.user = u;
                window.location.href = 'http://' + u.username + '.bitconnect.me/invitefriends';
             })
            .error(errhandle);
    }

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)
}

