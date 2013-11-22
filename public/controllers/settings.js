window.controllers.controller('SettingsController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', function($scope, $rootScope, $http, $location, me, requests, bitcoin) {

    window.wscope = $scope;

    $scope.sendtext = function() {
        $rootScope.message = {
            body: 'feature not implemented yet',
            canceltext: 'cool thanx'
        }
    }
    $scope.verify = $scope.sendtext

    $scope.checkLogin = function(pw,check,callback) {
        if (pw != check) $rootScope.errHandle('passwords don\'t match')
        else $rootScope.bitcoinLogin(pw,callback)
    }

}])
