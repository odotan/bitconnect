function NewAccountController($scope, $rootScope, $http, $location, me) {

    window.wscope = $scope;

    $scope.checkname = function() {
        $http.post('/checkname',{ name:$scope.firstname+'.'+$scope.lastname+'.bitconnect.me' })
            .success(function(r) {
                if (r == '"available"') $scope.available = true;
                else $scope.available = false;
             })
            .error(errhandle);
    }

    $scope.register = function() {
        $http.post('/register',{ name:$scope.firstname+'.'+$scope.lastname+'.bitconnect.me' })
            .success(function(u) {
                window.location.href = 'http://' + u.username + '/app/invitefriends';
             })
            .error(errhandle);
    }

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)
}

