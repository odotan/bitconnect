window.controllers.controller('GiveController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends', 'UsersService',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, FriendsService, UsersService) {

        window.wscope = $scope;

        $scope.give = {
            to: $location.search().to,
            tnx: $location.search().tnx,
            bts: $location.search().bts,
            message: $location.search().message
        }

        $scope.givemain = function() {
            if ($scope.btcmode) {
                $scope.givebtc();
            } else {
                $scope.givetnx();
            }
        }
        $scope.givetnx = function() {
            if (!parseInt($scope.give.tnx)) return;
            var getter;
            for (var key in $scope.usersById) {
                if ($scope.usersById[key].fullname == $scope.give.to) {
                    getter = $scope.usersById[key];
                    break;
                }
            }
            if ($rootScope.user.id == getter.id) {
                $rootScope.message = {
                    body: 'you can\'t give to yourself',
                    canceltext: 'ok'
                }
                return;
            }
            if (getter.username) {
                $http.post('/mkrequest', {
                    tnx: parseInt($scope.give.tnx),
                    giveTo: getter.id,
                    message: $scope.give.message,
                    requestType: $rootScope.RequestTypes.GIVE
                })
                    .success(function(r) {
                        $rootScope.message = {
                            body: 'request sent!',
                            canceltext: 'cool tnx'
                        }
                    })
                    .error($rootScope.errHandle);
            } else {
                FB.ui({
                    method: 'apprequests',
                    to: getter.id,
                    title: 'come bitconnect with me :)',
                    message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                }, function(req) {
                    $http.post('/mkinvite', {
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
            for (var key in $scope.usersById) {
                if ($scope.usersById[key].fullname == $scope.give.to) {
                    getter = $scope.usersById[key];
                    break;
                }
            }
            if ($rootScope.user.id == getter.id) {
                $rootScope.message = {
                    body: 'you can\'t give to yourself',
                    canceltext: 'ok'
                }
                return;
            }
            if (getter.username) {
                $rootScope.bitcoinSend(getter.username, parseInt($scope.give.bts), 10000, $scope.give.message)
            } else {
                FB.ui({
                    method: 'apprequests',
                    to: getter.id,
                    title: 'come bitconnect with me :)',
                    message: 'it’s an amazing cool new way to connect with friends. you’ll get 5432 thanx :)'
                }, function(req) {
                    $http.post('/mkinvite', {
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


        $scope.usersById = {}; // map of users filtered according to the current search

        $scope.$watch('give.to', function() {
            if (!$scope.give.to || $scope.give.to.length < 2) {
                return;
            }
            $scope.usersById = FriendsService.getFriendsByPartialName($scope.give.to);
            UsersService.getUsersByPartialName($scope.give.to, function(usersById) {
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