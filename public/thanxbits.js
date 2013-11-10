angular.module('thanxbits', []);

var el = function(x) { return document.getElementById(x); }
var qs = function(x) { return document.querySelectorAll(x); }

function ThanxCtrl($scope, $http, $location) {
    window.wscope = $scope;

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)

    $scope.checkname = function() {
        $http.post('/checkname',{name:'$scope.firstname+'.'+$scope.lastname'})
            .success(function(r) {
                if (r == 'available') $scope.available = true;
                else $scope.available = false;
            });
    }
    $scope.register = function() {
        $http.post('/register',{name:'$scope.firstname+'.'+$scope.lastname'})
            .success(function(u) {
                $scope.user = u;
            });
    }

}
