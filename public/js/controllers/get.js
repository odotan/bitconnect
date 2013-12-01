window.controllers.controller('GetController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

    window.wscope = $scope;

    $scope.get = {
        from: $location.search().from,
        tnx: $location.search().tnx,
        message: $location.search().message
    }

    $scope.getmain = function() {
        $http.get('/autofill?partial='+$scope.get.from)
             .success(function(r) {
                 if (r.length == 0) {
                     var f = $rootScope.FBfriends.filter(function(x) {
                         return x.first_name+" "+x.last_name == $scope.get.from 
                     })[0]
                     if (!f) return;
                     FB.ui({
                         method: 'apprequests',
                         to: f.id,
                         title: 'come bitconnect with me :)', 
                         message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                     }, function(req) {
                         $http.post('/mkinvite',{
                             from: $rootScope.user.id, 
                             to: f.id,
                             reqid: req.request
                         })
                         .success(function() { 
                            if($scope.btcmode){
                                $scope.getbtc(f.id);
                            }else{
                                $scope.gettnx(f.id);
                            }
                        })
                     });
                 }
                 else{
                    if( $scope.btcmode){
                        $scope.getbtc($scope.get.from);
                    }else{
                        $scope.gettnx($scope.get.from);
                    }
                 }
             })
    }
    $scope.getbtc = function(id) {
        if (!parseInt($scope.get.bts)) return;
        $http.post('/mkrequest',{
            sat: parseInt($scope.get.bts),
            from: id || $scope.get.from,
            message: $scope.get.message
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'request sent!',
                canceltext: 'cool sat'
            }
        })
        .error($rootScope.errHandle);
    }
    $scope.gettnx = function(id) {
        if (!parseInt($scope.get.tnx)) return;
        $http.post('/mkrequest',{
            tnx: parseInt($scope.get.tnx),
            from: id || $scope.get.from,
            message: $scope.get.message
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'request sent!',
                canceltext: 'cool tnx'
            }
        })
        .error($rootScope.errHandle);
    }
    $scope.usernames = []
    $scope.$watch('get.from',function() {
        if (!$scope.get.from || $scope.get.from.length < 2) return;
        $http.get('/autofill?partial='+$scope.get.from)
             .success(function(r) {
                var filter = function(f) {
                    if (!$scope.get.from)
                        return true;
                    var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                        searchString = $scope.get.from.toLowerCase();
                    return friendString.indexOf(searchString) >= 0;
                }
                var friends= $rootScope.FBfriends.filter(filter).map(function(f) {
                    return f.first_name+' '+f.last_name;                        
                });
                $scope.usernames = r.concat(friends);
                return;
             })
    })
}])
