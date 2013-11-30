window.controllers.controller('GetController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

    window.wscope = $scope;

    $scope.get = {
        from: $location.search().from,
        tnx: $location.search().tnx,
        message: $location.search().message
    }

    $scope.gettnx = function() {
        $http.get('/autofill?partial='+$scope.get.from)
             .success(function(r) {
                 if (r.length == 0) {
                     var f = $rootScope.FBfriends.filter(function(x) {
		                 return x.first_name+" "+x.last_name == $scope.get.from 
                     })[0]
                     if (!f) return;
                     FB.ui({method: 'apprequests',
                         to: f.id,
                         title: 'come bitconnect with me :)', 
                         message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                     }, function(req) {
                         $http.post('/mkinvite',{
                             from: $rootScope.user.id, 
                             to: f.id,
                             reqid: req.request
                         })
                         .success(function() { $scope.gettnx2(f.id) });
                     })
                 }
                 else $scope.gettnx2($scope.get.from);
             })
    }
    $scope.gettnx2 = function(id) {
        if (!parseInt($scope.get.tnx)) return;
        $http.post('/mkrequest',{
            tnx: parseInt($scope.get.tnx),
            from: id || $scope.get.from,
            message: $scope.get.message
        })
        .success(function(r) {
            $rootScope.message = {
                body: 'request sent!',
                canceltext: 'cool thanx'
            }
        })
        .error($rootScope.errHandle);
    }
    $scope.usernames = []
    $scope.$watch('get.from',function() {
        if (!$scope.get.from || $scope.get.from.length < 2) return;
        $http.get('/autofill?partial='+$scope.get.from)
             .success(function(r) {
                var friends = $rootScope.FBfriends.map(function(f) {
                    return f.first_name+' '+f.last_name
                })
                $scope.usernames = r.concat(friends)
             })
    })
}])
