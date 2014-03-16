window.controllers.controller('InviteFriendsController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', 'GlobalInvitationsService', function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends, GlobalInvitationsService) {

    window.wscope = $scope;

    // Control the visible friend list
    $scope.visibleFriendsLimit = 20;
    //chunk of friends to get when scrolling down
    $scope.friendsChunk = 30;

    $rootScope.$watch('user.fbUser',$scope.getfriends);

    $scope.giveget = function() { window.location.href = '/giveget'; };

    $scope.updateVisibleFriends = function() {
        var filter = function(f) {
            if (!$scope.searchstring)
                return true;
            var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                searchString = $scope.searchstring.toLowerCase();
            return friendString.indexOf(searchString) >= 0;
        };
        if ($rootScope.user && $rootScope.user.friends && $rootScope.FBfriends) {
            $scope.filteredFriends = $rootScope.FBfriends.filter(filter);
            var nvf = $scope.filteredFriends.slice(0,$scope.visibleFriendsLimit),
                nvflist = nvf.map(function(x) { return x.id; }),
                ovflist = ($scope.visibleFriends || []).map(function(x) { return x.id; });
            if (JSON.stringify(nvflist) != JSON.stringify(ovflist)) {
                $scope.visibleFriends = nvf;
            }
        }
    };

    $rootScope.$watch('FBfriends',$scope.updateVisibleFriends);
    $scope.$watch('searchstring',$scope.updateVisibleFriends);
    $scope.$watch('visibleFriendsLimit',$scope.updateVisibleFriends);

    setInterval(function() {
        if ($rootScope.path() != 'us') return;
        if (!$scope.FBfriends || !$scope.filteredFriends) return;
        if (window.pageYOffset > document.height - 1250 && $scope.visibleFriendsLimit < $scope.filteredFriends.length) {
            $scope.visibleFriendsLimit += 40;
            if (!$scope.$$phase) $scope.$apply();
        }
    },416);

    // Select friends
    $scope.selected = {};
    $scope.numselected = 0;

    $scope.selectFriend = function(id) {
        if (!$scope.selected[id]) {
            if ($scope.numselected < $rootScope.invitationLimit - $rootScope.usedInvitations) {
                $scope.selected[id] = true;
                $scope.numselected += 1;
            }
        }
        else {
            delete $scope.selected[id];
            $scope.numselected -= 1;
        }
        if (!$scope.$$phase) { $scope.$apply(); }
    };

    $scope.selectNone = function() {
        $scope.selected = {};
        $scope.numselected = 0;
    };

    // Invite friends
    $scope.invite = function() {
        if ( Object.keys($scope.selected).length === 0 ) {
            $rootScope.message = {
                body: 'please select friends to invite',
                canceltext: 'cool thanx'
            };
            return;
        }
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
                };
            });
        });
    };

    // Done
    $scope.done = function() { $rootScope.goto('thanx'); };
	
    $scope.loadMoreFriends = function () {
        if (angular.isUndefined($scope.FBfriends)) {
            return;
        }
		var nextChunk = $scope.visibleFriendsLimit + $scope.friendsChunk;
        var diff = $scope.FBfriends.length - nextChunk;
        if (diff >= 0) {
            $scope.visibleFriendsLimit = nextChunk;    
        } else {
            $scope.visibleFriendsLimit = $scope.FBfriends.length;
        }
	};
}]);


