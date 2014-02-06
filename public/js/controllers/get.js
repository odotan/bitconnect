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

        function isValidUser(value) {
            if (angular.isUndefined(value) || value === '') {
                return true;
            }
            return angular.isObject(value);
        }

        $scope.getmain = function() {
            function clearValues() {
                $scope.get = {};
            }
            if (!$scope.getForm.$valid) {
                $scope.showErrors = true;
                return;
            } else {
                $scope.showErrors = false;
            }
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
                    if ($scope.btcmode == 'sat') {
                        $scope.getbtc(clearValues);
                    } else if (!$scope.btcmode || $scope.btcmode == 'tnx') {
                        $scope.gettnx(clearValues);
                    }
                } else {
                    FB.ui({
                        method: 'apprequests',
                        to: giver.id,
                        message: $scope.get.message || 'bitconnect is a place where thanx means a lot.'
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
                                if (angular.isDefined(req) && angular.isDefined(req.to)) {
                                    if ($scope.btcmode == 'sat') {
                                        $scope.getbtc(clearValues);
                                    } else if (!$scope.btcmode || $scope.btcmode == 'tnx') {
                                        $scope.gettnx(clearValues);
                                    }
                                }
                            });
                    });
                }
            }
        }
        $scope.getbtc = function() {
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
                getFrom: giver.id,
                message: $scope.get.message,
                requestType: RequestTypes.GET
            })
                .success(function(r) {
                    $rootScope.message = {
                        body: 'request sent!',
                        canceltext: 'cool sat'
                    }
                    if (successCB) {
                        successCB();
                    }
                })
                .error($rootScope.errHandle);
        }
        $scope.gettnx = function(successCB) {
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
                getFrom: giver.id,
                message: $scope.get.message,
                requestType: RequestTypes.GET
            })
                .success(function(r) {
                    $rootScope.message = {
                        body: 'request sent!',
                        canceltext: 'cool tnx'
                    }
                    if (successCB) {
                        successCB();
                    }
                })
                .error($rootScope.errHandle);
        }

        $scope.usersById = {}; // map of users filtered according to the current search

        angular.element('#getFrom').blur(function(e) {
            angular.element('#getFrom').controller('ngModel').$setValidity('user', isValidUser($scope.get.from));
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$watch('get.from', function() {
            if (isValidUser($scope.get.from)) {
                angular.element('#getFrom').controller('ngModel').$setValidity('user', true);
            }
            if (angular.isUndefined($scope.get) ||
                angular.isUndefined($scope.get.from) ||
                angular.isObject($scope.get.from) ||
                $scope.get.from.length < 2) {
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
                if ($scope.usersById.hasOwnProperty(key) &&
                    UsersService.userFilter($scope.usersById[key], enteredText) &&
                    key !== $scope.user.id) {
                    res.push($scope.usersById[key]);
                }
            }
            return res;
        };
    }
])