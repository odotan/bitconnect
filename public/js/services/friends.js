window.app.service('friends', ['$rootScope', '$http', 'UsersService',
    function($rootScope, $http, UsersService) {

        window.rscope = $rootScope;

        $rootScope.getfriends = function() {
            $http.get('/friends')
                .success(function(f) {
                    $rootScope.FBfriends = f;
                })
                .error(function(e) {
                    errhandle();
                    $rootScope.getfriends();
                });
        };

        $rootScope.getfriends();

        /**
         *   Returns a map of facebook friends by id, filtered by the given text.
         *   Uses UserService.userFilter to filter the users.
         */
        this.getFriendsByPartialName = function getFriendsByPartialName(partialName) {
            if (!$rootScope.FBfriends) {
                return {};
            }
            var friendsById = {};
            var friends = $rootScope.FBfriends.registeredFriends.filter(function(user) {
                return UsersService.userFilter(user, partialName);
            });

            friends.forEach(function(friend) {
                friendsById[friend.id] = {
                    fullname: friend.first_name + ' ' + friend.last_name,
                    id: friend.id,
                    username: friend.username
                };
            });
            return friendsById;
        };
    }
]);