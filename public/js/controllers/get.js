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
                     if( $rootScope.user.id == f.id) {
                        $rootScope.message = {
                            body: 'you can\'t get from yourself',
                            canceltext: 'ok'
                        }
                         return;
                     }
                     FB.ui({
                         method: 'apprequests',
                         to: f.id,
                         title: 'come bitconnect with me :)', 
                         message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                     }, function(req) {
                         $http.post('/mkinvite',{
                             from: $rootScope.user.id, 
                             to: [f.id],
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
                        $scope.getbtc();
                    }else{
                        $scope.gettnx();
                    }
                 }
             })
    }
    $scope.getbtc = function(id) {
        if (!parseInt($scope.get.bts)) return;

        var giver;
        for(var i=0; i < $scope.usernames.length; i++){
            if( $scope.usernames[i].fullname == $scope.get.from ){
                giver= $scope.usernames[i];
                break;
            }
        }

        if( $rootScope.user.id == giver.id){
            $rootScope.message = {
                body: 'you can\'t get from yourself',
                canceltext: 'ok'
            }
             return;
         } 

        $http.post('/mkrequest',{
            sat: parseInt($scope.get.bts),
            from: id || giver.id,
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

        var giver;
        for(var i=0; i < $scope.usernames.length; i++){
            if( $scope.usernames[i].fullname == $scope.get.from ){
                giver= $scope.usernames[i];
                break;
            }
        }
         if( $rootScope.user.id == giver.id){
            $rootScope.message = {
                body: 'you can\'t get from yourself',
                canceltext: 'ok'
            }
             return;
         } 

        $http.post('/mkrequest',{
            tnx: parseInt($scope.get.tnx),
            from: id || giver.id,
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
                 //get the facebook friends validated against the search query
                var filter = function(f) {
                    if (!$scope.get.from)
                        return true;
                    var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                        searchString = $scope.get.from.toLowerCase();
                    return friendString.indexOf(searchString) >= 0;
                }
                var friends= $rootScope.FBfriends.filter(filter).map(function(f) {
                    return { fullname: f.first_name+' '+f.last_name,
                            id: f.id };                        
                });


                var tmp= {};
                for(var i=0; i < friends.length; i++){
                    var friend= friends[i];
                    tmp[friend.id]= {
                         fullname: friend.fullname
                    };
                }
                for(var j=0; j < r.length; j++){
                    var friend= r[j];
                    if(tmp[friend.id]){
                        tmp[friend.id].username= friend.username;
                    }else{
                        tmp[friend.id]= {
                             username: friend.username,
                             fullname: friend.fullname
                        };
                    }
                }

                var res= [];
                for(var key in tmp){
                    res.push({
                        id: key,
                        username: tmp[key].username,
                        fullname: tmp[key].fullname
                    });
                }
           
                $scope.usernames = res;

                if( res.length == 0){
                    $scope.usernames = ["no match for: " + $scope.get.from];
                }

                return;
             })
    })
}])
