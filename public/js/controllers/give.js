window.controllers.controller('GiveController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

    window.wscope = $scope;

    $scope.give = {
        to: $location.search().to,
        tnx: $location.search().tnx,
        bts: $location.search().bts,
        message: $location.search().message
    }

    $scope.givemain = function() {
        if ($scope.btcmode){
            $scope.givebtc();
        }else{
            $scope.givetnx();
        }
    }
    $scope.givetnx = function() {
        if (!parseInt($scope.give.tnx)) return;
        $rootScope.thanxSend($scope.give.to,parseInt($scope.give.tnx),null,$scope.give.message)
    }
    $scope.givebtc = function() {
        if (!parseInt($scope.give.bts)) return;
        $rootScope.bitcoinSend($scope.give.to,parseInt($scope.give.bts),10000,$scope.give.message)
    }
    $scope.usernames = []
    $scope.$watch('give.to',function() {
        if (!$scope.give.to || $scope.give.to.length < 2) return;
        $http.get('/autofill?partial='+$scope.give.to)
             .success(function(r) {
                var filter = function(f) {
                    if (!$scope.give.to)
                        return true;
                    var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                        searchString = $scope.give.to.toLowerCase();
                    return friendString.indexOf(searchString) >= 0;
                }
                var friends= $rootScope.FBfriends.filter(filter).map(function(f) {
                    return f.first_name+' '+f.last_name;                        
                });
                $scope.usernames = r.concat(friends);
                if( $scope.usernames.length == 0){
                    $scope.usernames = ["no match for: " + $scope.give.to];
                }

                return;
             })
    })
}])
