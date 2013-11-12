function GiveGetCtrl($scope, $rootScope, $http, $location, me) {

    window.wscope = $scope;

    $scope.mode = 'give';
    
    $scope.give = function() {
        if (!$scope.btc && !$scope.tnx) return;
        $http.post('/give',{
            sat: Math.ceil($scope.btc * 100000000),
            tnx: $scope.tnx,
            to: $scope.to
        })
        .success(function(r) {
            $scope.message = {
                body: 'you have given '+$scope.to+' '+($scope.tnx || 0)+' thanxbits and '+($scope.btc || 0)+' btp successfully.',
                canceltext: 'cool thanx'
            }
        })
        .error(function(e) {
            $scope.message = {
                body: e,
                canceltext: 'cool thanx'
            }
        });
    }
}
