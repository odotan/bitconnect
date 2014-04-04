window.controllers.controller('InviteFriendsController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', 'GlobalInvitationsService',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends, GlobalInvitationsService) {

        window.wscope = $scope;

        // Control the visible friend list
        $scope.visibleFriendsLimit = 20;
        //chunk of friends to get when scrolling down
        $scope.friendsChunk = 30;
        $scope.visibleFriends = {};
        //$rootScope.$watch('user.fbUser',$scope.getfriends);

        $scope.giveget = function() {
            window.location.href = '/giveget';
        };

        $scope.updateVisibleFriends = function() {
            var filter = function(f) {
                if (!$scope.searchstring)
                    return true;
                var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                    searchString = $scope.searchstring.toLowerCase();
                return friendString.indexOf(searchString) >= 0;
            };
            if ($rootScope.user && $rootScope.user.friends && $rootScope.FBfriends) {
                $scope.filteredFriends = $rootScope.FBfriends.otherFriends.filter(filter);
                var nvf = $scope.filteredFriends.slice(0, $scope.visibleFriendsLimit),
                    nvflist = nvf.map(function(x) {
                        return x.id;
                    }),
                    ovflist = ($scope.visibleFriends.otherFriends || []).map(function(x) {
                        return x.id;
                    });
                if (JSON.stringify(nvflist) != JSON.stringify(ovflist)) {
                    $scope.visibleFriends.otherFriends = nvf;
                }
            }
        };

        $rootScope.$watch('FBfriends', $scope.updateVisibleFriends);

        // Select friends
        $scope.selected = {};
        $scope.numselected = 0;

        $scope.selectFriend = function(id) {
            if (!$scope.selected[id]) {
                if ($scope.numselected < $rootScope.invitationLimit - $rootScope.usedInvitations) {
                    $scope.selected[id] = true;
                    $scope.numselected += 1;
                }
            } else {
                delete $scope.selected[id];
                $scope.numselected -= 1;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };
        $scope.loadMoreFriends = function() {
            if (angular.isUndefined($scope.FBfriends) || angular.isUndefined($scope.FBfriends.otherFriends)) {
                return;
            }
            var nextChunk = $scope.visibleFriendsLimit + $scope.friendsChunk; 
            var diff = $scope.FBfriends.otherFriends.length - nextChunk;
            if (diff >= 0) {
                $scope.visibleFriendsLimit = nextChunk;
            } else {
                $scope.visibleFriendsLimit = $scope.FBfriends.otherFriends.length;
            }
            $scope.updateVisibleFriends();
        };
        $scope.selectNone = function() {
            $scope.selected = {};
            $scope.numselected = 0;
        };

        // Invite friends
        $scope.invite = function(friendId) {
            console.log(friendId.toString());
            FB.ui({
                method: 'apprequests',
                to: [friendId],
                title: 'come bitconnect with me :)',
                message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)',
            }, function(req) {
                if (!req || angular.isUndefined(req.to)) return;
                console.log(req);
                $http.post('/mkinvite', {
                    from: $rootScope.user.id,
                    to: [friendId],
                    reqid: req.request
                });
            });
        };

        // Done
        $scope.done = function() {
            $rootScope.goTo('thanx');
        };


    }
]);