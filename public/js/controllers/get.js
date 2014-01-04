window.controllers.controller('GetController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', 'UsersService',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, FriendsService, UsersService) {

        window.wscope = $scope;

        $scope.get = {
            from: $location.search().from,
            tnx: $location.search().tnx,
            message: $location.search().message
        }

        $scope.getmain = function() {
            $http.get('/autofill?partial=' + $scope.get.from)
                .success(function(r) {
                    if (r.length == 0) {
                        var f = $rootScope.FBfriends.filter(function(x) {
                            return x.first_name + " " + x.last_name == $scope.get.from
                        })[0]
                        if (!f) return;
                        if ($rootScope.user.id == f.id) {
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
                            $http.post('/mkinvite', {
                                from: $rootScope.user.id,
                                to: [f.id],
                                reqid: req.request
                            })
                                .success(function() {
                                    if ($scope.btcmode) {
                                        $scope.getbtc(f.id);
                                    } else {
                                        $scope.gettnx(f.id);
                                    }
                                })
                        });
                    } else {
                        if ($scope.btcmode) {
                            $scope.getbtc();
                        } else {
                            $scope.gettnx();
                        }
                    }
                })
        }
        $scope.getbtc = function(id) {
            if (!parseInt($scope.get.bts)) return;

            var giver;
            for (var key in $scope.usersById) {
                if ($scope.usersById.hasOwnProperty(key) && $scope.usersById[key].fullname == $scope.get.from) {
                    giver = $scope.usersById[key];
                    break;
                }
            }

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
                requestType: $rootScope.RequestTypes.GET
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
            for (var key in $scope.usersById) {
                if ($scope.usersById.hasOwnProperty(key) && $scope.usersById[key].fullname == $scope.get.from) {
                    giver = $scope.usersById[key];
                    break;
                }
            }
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
                requestType: $rootScope.RequestTypes.GET
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