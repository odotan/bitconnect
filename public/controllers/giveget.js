function GiveGetCtrl($scope, $rootScope, $http, $location, me, requests) {

    window.wscope = $scope;

    $scope.mode = 'give';

    if (window.location.href.indexOf('/sendto') >= 0) {
        var parts = window.location.host.split('.'),
            profileId = parts.slice(0,2).join('.');
        if (parts.length == 4) {
            $scope.to = profileId;
            $scope.from = profileId;
            $http.get('/picture')
                .success(function(r) {  $scope.picurl = r.replace(/\"/g,'') })
        }
    }

    $scope.invitefriends = function() { window.location.href = '/invitefriends' }
    
    $scope.give = function() {
        if (!$scope.givebtc && !$scope.givetnx) return;
        $http.post('/give',{
            sat: Math.ceil($scope.givebtc * 100000000),
            tnx: $scope.givetnx,
            to: $scope.to,
            message: $rootScope.message
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'you have given '+$scope.to+' '+($scope.tnx || 0)+' thanxbits and '+($scope.btc || 0)+' btp successfully.',
                canceltext: 'cool thanx'
            }
        })
        .error(function(e) {
            $rootScope.message = {
                body: e,
                canceltext: 'cool thanx'
            }
        });
    }

    $scope.get = function() {
        if (!$scope.getbtc && !$scope.gettnx) return;
        $http.post('/get',{
            sat: Math.ceil(parseFloat($scope.getbtc) * 100000000) || 0,
            tnx: parseInt($scope.gettnx) || 0,
            from: $scope.from,
            message: $scope.getmessage
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'request sent!',
                canceltext: 'cool thanx'
            }
        })
        .error(function(e) {
            $rootScope.message = {
                body: e,
                canceltext: 'cool thanx'
            }
        })
    }

    $scope.accept = function(invoice_id) {
        $rootScope.message = {
            body: 'are you sure you want to accept?',
            action: function() {
                $http.post('/accept',{ invoice_id: invoice_id })
                    .success(function() { $rootScope.message = { body: 'accepted', canceltext: 'cool thanx' } })
                    .error(function(e) { $rootScope.message = { body: e, canceltext: 'cool thanx' } })
                },
            actiontext: 'yep',
            canceltext: 'nope'
        }
    }

    $scope.reject = function(invoice_id) {
        $rootScope.message = {
            body: 'are you sure you want to reject?',
            action: function() {
                $http.post('/reject',{ invoice_id: invoice_id })
                    .success(function() { $rootScope.message = { body: 'rejected', canceltext: 'cool thanx' } })
                    .error(function(e) { $rootScope.message = { body: e, canceltext: 'cool thanx' } })
                },
            actiontext: 'yep',
            canceltext: 'nope'
        }
    }
}
