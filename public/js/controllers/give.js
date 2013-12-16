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
        var getter;
        for(var i=0; i < $scope.usernames.length; i++){
            if( $scope.usernames[i].fullname == $scope.give.to ){
                getter= $scope.usernames[i];
                break;
            }
        }
        if( $rootScope.user.id == getter.id){
            $rootScope.message = {
                body: 'you can\'t give to yourself',
                canceltext: 'ok'
            }
             return;
         } 
        if(getter.username){
            $rootScope.thanxSend(getter.username, parseInt($scope.give.tnx),null,$scope.give.message)
        }else{
            FB.ui({
                     method: 'apprequests',
                     to: getter.id,
                     title: 'come bitconnect with me :)', 
                     message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                 }, function(req) {
                     $http.post('/mkinvite',{
                         from: $rootScope.user.id, 
                         to: getter.id,
                         reqid: req.request
                     })
                     .success(function() { 
                      //  $scope.givetnx();
                    })
            }); 
            //$rootScope.message = { body: getter.fullname + ' is not signed up, would you like to invite them? They will recieve your thanx when they sign up.', canceltext: 'invite' }
        }
    }
    $scope.givebtc = function() {
        if (!parseInt($scope.give.bts)) return;
        var getter;
        for(var i=0; i < $scope.usernames.length; i++){
            if( $scope.usernames[i].fullname == $scope.give.to ){
                getter= $scope.usernames[i];
                break;
            }
        }
         if( $rootScope.user.id == getter.id){
            $rootScope.message = {
                body: 'you can\'t give to yourself',
                canceltext: 'ok'
            }
             return;
         } 
        if(getter.username){
            $rootScope.bitcoinSend(getter.username, parseInt($scope.give.bts),10000,$scope.give.message)
        }else{
             FB.ui({
                 method: 'apprequests',
                 to: getter.id,
                 title: 'come bitconnect with me :)', 
                 message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
             }, function(req) {
                 $http.post('/mkinvite',{
                     from: $rootScope.user.id, 
                     to: getter.id,
                     reqid: req.request
                 })
                 .success(function() { 
                  //  $scope.givetnx();
                })
             });
            //$rootScope.message = { body: getter.fullname + ' is not signed up, would you like to invite them? They will recieve your satoshi when they sign up.', canceltext: 'invite' }
        }
        
    }
    $scope.usernames = []
    $scope.$watch('give.to',function() {
        if (!$scope.give.to || $scope.give.to.length < 2) return;
        $http.get('/autofill?partial='+$scope.give.to)
             .success(function(r) {
                //get the facebook friends validated against the search query
                var filter = function(f) {
                    if (!$scope.give.to)
                        return true;
                    var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                        searchString = $scope.give.to.toLowerCase();
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

/*
                var res= [];
                //get users that are friends and signed up
                for(var i=0; i < friends.length; i++){
                    var friend= friends[i];
                    for(var j=0; j < r.length; j++){
                        if( friend.id == r[j].id ){
                            res.push({
                                fullname: friend.fullname,
                                id: friend.id,
                                username: r[j].username
                            });
                        }
                    }   
                }
                //get users that are friends but are NOT signed up
                

                //get users that are signed up but not friends
*/           
                
                $scope.usernames = res;

                if( res.length == 0){
                    $scope.usernames = ["no match for: " + $scope.give.to];
                }

                return;
             })
    })
}])
