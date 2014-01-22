window.controllers.controller('InviteFriendsController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

    window.wscope = $scope;
    //chunk of friends to get when scrolling down
    $scope.friendsChunk = 30;

    $rootScope.$watch('user.fbUser',$scope.getfriends);

    $scope.giveget = function() { window.location.href = '/giveget' }

    $scope.updateVisibleFriends = function() {
        var filter = function(f) {
            if (!$scope.searchstring)
                return true;
            var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                searchString = $scope.searchstring.toLowerCase();
            return friendString.indexOf(searchString) >= 0;
        }
        if ($rootScope.user && $rootScope.user.friends && $rootScope.FBfriends) {
            $scope.filteredFriends = $rootScope.FBfriends.filter(filter);
            var nvf = $scope.filteredFriends,
                nvflist = nvf.map(function(x) { return x.id }),
                ovflist = ($scope.visibleFriends || []).map(function(x) { return x.id })
            if (JSON.stringify(nvflist) != JSON.stringify(ovflist)) {
                $scope.visibleFriends = nvf
                $scope.visibleFriends.map(function(f) {
                    if (f.isUser) $scope.unaddableFriends[f.id] = true
                    else if ($scope.unaddableFriends[f.id]) delete $scope.unaddableFriends[f.id]
                })
            }
        }
    };

    $scope.unaddableFriends = {}

    $rootScope.$watch('FBfriends',$scope.updateVisibleFriends);
    $scope.$watch('searchstring',$scope.updateVisibleFriends);


    // Kill account (testing only)
    $scope.kill = function() {
        $http.post('/kill')
            .success(function(r) {
                $rootScope.user = r;
                location.href='/app/newaccount'
             })
            .error(errhandle);
    }

    // Select friends
    $scope.selected = {}
    $scope.numselected = 0

    $scope.selectFriend = function(id) {
        if ($scope.unaddableFriends[id]) return
        if (!$scope.selected[id]) {
            $scope.selected[id] = true;
            $scope.numselected += 1;
        }
        else {
            delete $scope.selected[id];
            $scope.numselected -= 1;
        }
        if (!$scope.$$phase) { $scope.$apply() }
    }
    $scope.selectAll = function() {
        $scope.filteredFriends.map(function(f) {
            if ($scope.unaddableFriends[f.id]) return
            $scope.selected[f.id] = true;
        });
        $scope.numselected = $scope.filteredFriends.length;
    }
    $scope.selectNone = function() {
        $scope.selected = {};
        $scope.numselected = 0;
    }

    // Invite friends
    $scope.invite = function() {
        FB.ui({method: 'apprequests',
             to: Object.keys($scope.selected),
             title: 'come bitconnect with me :)', 
             message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)',
        }, function(req) { 
            if (!req || angular.isUndefined(req.to)) return;
            console.log(req);
            $http.post('/mkinvite',{
                from: $rootScope.user.id, 
                to: Object.keys($scope.selected),
                reqid: req.request
            })
            .success(function(r) {
                $rootScope.message = {   
                    body: 'thanx a lot for inviting your friends. '+$scope.numselected+' invitations sent. you have gotten '+r.bonus+' thanxbits. don\'t forget to remind your friends to sign up. you will both get a lot more thanxbits when they do :)',
                    actiontext: 'cool thanx',
                    action: function(){ $rootScope.message.body = null; $rootScope.goto('thanx'); },
                    canceltext:  'i wanna invite more friends'
                }
            });
        });
    }

    // Done
    $scope.done = function() { $rootScope.goto('thanx') }
}])


