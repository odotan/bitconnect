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
        console.log(123);
        $http.post('/register',{ name:$scope.firstname+'.'+$scope.lastname })
            .success(function(u) {
                console.log(456);
                $rootScope.user = u;
                window.location.href = '/invitefriends';
             })
            .error(errhandle);
    }

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)
}

