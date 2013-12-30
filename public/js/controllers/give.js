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
        for(var key in $scope.usersById){
            if( $scope.usersById[key].fullname == $scope.give.to ){
                getter= $scope.usersById[key];
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
            $rootScope.thanxSend(getter.username, parseInt($scope.give.tnx),null,$scope.give.message, $rootScope.TxTypes.giveRequest);
        }else{
            FB.ui({
                     method: 'apprequests',
                     to: getter.id,
                     title: 'come bitconnect with me :)', 
                     message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                 }, function(req) {
                     $http.post('/mkinvite',{
                         from: $rootScope.user.id, 
                         to: [getter.id],
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
                     to: [getter.id],
                     reqid: req.request
                 })
                 .success(function() { 
                  //  $scope.givetnx();
                })
             });
            //$rootScope.message = { body: getter.fullname + ' is not signed up, would you like to invite them? They will recieve your satoshi when they sign up.', canceltext: 'invite' }
        }
        
    }
    var userFilter = function(user, enteredText) {
        var names = user.fullname.toLowerCase().split(' '),
        enteredNames = enteredText.toLowerCase().split(' '),
        i=0;
        for (i=0; i<enteredNames.length-1; i++) {
            var nameIndex = names.indexOf(enteredNames[i]);
            if (nameIndex === -1) {
                return false;
            }
            else {
                names.splice(nameIndex, 1);
            }
        }
        for (i=0; i<names.length; i++) {
            if (names[i].indexOf(enteredNames[enteredNames.length-1]) === 0) {
                return true;
            }
        }
        return false;
    }
    $scope.getFilteredUsers = function(enteredText) {
        if (!enteredText || enteredText.length < 2) {
            return;
        }
        var res = [];
        for (var key in $scope.usersById) {
            res.push($scope.usersById[key]);
        }
        res = res.filter(function(u) {
            return userFilter(u, enteredText);
        });
        res.$$v = res;
        return res;
    };
    $scope.usersById = {};
    $scope.$watch('give.to',function() {
        if (!$scope.give.to || $scope.give.to.length < 2) {
            return;
        }
        $scope.usersById = {};
        if($rootScope.FBfriends) {
            var friends = $rootScope.FBfriends.map(function(f) {
                return { fullname: f.first_name+' '+f.last_name,
                        id: f.id };                        
            }).filter(function(u) {
                return userFilter(u, $scope.give.to);
            });

            for(var i=0; i < friends.length; i++){
                var friend= friends[i];
                $scope.usersById[friend.id]= {
                     fullname: friend.fullname,
                };
            }
        }
        $http.get('/autofill?partial='+$scope.give.to)
             .success(function(r) {
                for(var j=0; j < r.length; j++){
                    var friend= r[j];
                    if($scope.usersById[friend.id]){
                        $scope.usersById[friend.id].username = friend.username;
                        $scope.usersById[friend.id].id = friend.id;
                    } else {
                        $scope.usersById[friend.id] = {
                             id: friend.id,
                             username: friend.username,
                             fullname: friend.fullname,
                        };
                    }
                }
             });
    });
}])
