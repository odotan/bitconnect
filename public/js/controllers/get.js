window.controllers.controller('GetController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', 'UsersService', 'RequestTypes',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, FriendsService, UsersService, RequestTypes) {

        window.wscope = $scope;
        if ($location.search().fromId) {
            UsersService.getUserById($location.search().fromId, function(user) {
                $scope.get = {
                    from: user
                };
            });
        } else {
            $scope.get = {
                from: $location.search().from,
                tnx: $location.search().tnx,
                message: $location.search().message
            }
        }

        $scope.getmain = function() {
            if (angular.isObject($scope.get.from)) {
                var giver = $scope.get.from;
                if ($scope.get.from.username) {
                    if ($rootScope.user.id == giver.id) {
                        $rootScope.message = {
                            body: 'you can\'t get from yourself',
                            canceltext: 'ok'
                        }
                        return;
                    }
                    if ($scope.btcmode) {
                        $scope.getbtc();
                    } else {
                        $scope.gettnx();
                    }
                } else {
                    FB.ui({
                        method: 'apprequests',
                        to: giver.id,
                        title: 'come bitconnect with me :)',
                        message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                    }, function(req) {
                        if (!req || angular.isUndefined(req.to)) {
                            return;
                        }
                        $http.post('/mkinvite', {
                            from: $rootScope.user.id,
                            to: [giver.id],
                            reqid: req.request
                        })
                            .success(function() {
                                if ($scope.btcmode) {
                                    //$scope.getbtc(giver.id);
                                } else {
                                    //$scope.gettnx(giver.id);
                                }
                            })
                    });
                }
            }
        }
        $scope.getbtc = function(id) {
            if (!parseInt($scope.get.bts)) return;
            if (!angular.isObject($scope.get.from)) {
                return;
            }
            var giver = $scope.get.from;
            if ($rootScope.user.id == giver.id) {
                $rootScope.message = {
                    body: 'you can\'t get from yourself',
                    canceltext: 'ok'
                }
                return;
            }

            $http.post('/mkrequest', {
                sat: parseInt($scope.get.bts),
                getFrom: id || giver.id,
                message: $scope.get.message,
                requestType: RequestTypes.GET
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
            if (!angular.isObject($scope.get.from)) {
                return;
            }
            var giver = $scope.get.from;
            if ($rootScope.user.id == giver.id) {
                $rootScope.message = {
                    body: 'you can\'t get from yourself',
                    canceltext: 'ok'
                }
                return;
            }

            $http.post('/mkrequest', {
                tnx: parseInt($scope.get.tnx),
                getFrom: id || giver.id,
                message: $scope.get.message,
                requestType: RequestTypes.GET
            })
                .success(function(r) {
                    $rootScope.message = {
                        body: 'request sent!',
                        canceltext: 'cool tnx'
                    }
                })
            .error($rootScope.errHandle);
        }

        $scope.usersById = {}; // map of users filtered according to the current search


        $scope.$watch('get.from', function() {
            if (!$scope.get.from || $scope.get.from.length < 2) {
                return;
            }
            $scope.usersById = FriendsService.getFriendsByPartialName($scope.get.from);
            UsersService.getUsersByPartialName($scope.get.from, function(usersById) {
                UsersService.combineMaps($scope.usersById, usersById);
            });
        });

        /**
         *   Gets users filtered by the given text as an array.
         *   Returns only users the are in $scope.usersById.
         */
        $scope.getFilteredUsers = function(enteredText) {
            if (!enteredText || enteredText.length < 2) {
                return;
            }
            var res = [];
            for (var key in $scope.usersById) {
                if ($scope.usersById.hasOwnProperty(key) && UsersService.userFilter($scope.usersById[key], enteredText)) {
                    res.push($scope.usersById[key]);
                }
            }
            return res;
        };
    }
])