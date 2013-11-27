
function ProfileCtrl($scope, $rootScope, $http, $location, me) {

    window.wscope = $scope;

    $scope.username = window.location.host.split('.').slice(0,2).join('.')+'.bitconnect.me'

    $scope.gotoGive = function() {
        window.location.href = '/give?to='+$scope.username
    }

    $scope.gotoGet = function() {
        window.location.href = '/get?from='+$scope.username
    }

}
