angular.module('thanxbits', []);

var el = function(x) { return document.getElementById(x); }
var qs = function(x) { return document.querySelectorAll(x); }

var errhandle = function(r) { console.log("Error",r); }

function ThanxCtrl($scope, $http, $location) {
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
                $scope.user = u;
             })
            .error(errhandle);
    }
    $scope.kill = function() {
        $http.post('/kill')
            .success(function(r) {
                $scope.user = r 
                $scope.checkname()
             })
            .error(errhandle);
    }

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)

    $http.get('/me')
        .success(function(u) { 
            $scope.user = u
            $scope.firstname = $scope.user.fbUser.first_name.toLowerCase();
            $scope.lastname = $scope.user.fbUser.last_name.toLowerCase();
         })
        .error(errhandle);

}

