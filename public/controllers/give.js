window.controllers.controller('GiveController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', function($scope, $rootScope, $http, $location, me, requests, bitcoin) {

    window.wscope = $scope;

    $scope.give = {
        to: $location.search().to,
        tnx: $location.search().tnx,
        bts: $location.search().bts,
        message: $location.search().message
    }

    $scope.givetnx = function() {
        if (!parseInt($scope.give.tnx)) return;
        $rootScope.thanxSend($scope.give.to,parseInt($scope.give.tnx),null,$scope.give.message)
    }
    $scope.givebtc = function() {
        if (!$scope.give.bts) return;
        $rootScope.bitcoinSend($scope.give.to,parseInt($scope.give.bts),10000,$scope.give.message)
    }
    $scope.usernames = []
    $scope.$watch('give.to',function() {
        if (!$scope.give.to || $scope.give.to.length < 2) return;
        $http.get('/autofill?partial='+$scope.give.to)
             .success(function(r) {
                $scope.usernames = r
             })
    })
}])
