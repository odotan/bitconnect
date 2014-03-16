window.controllers.controller('GiveController', ['$scope', '$rootScope', '$window', '$http', '$location', 'friends', 'requests', 'bitcoin', 'UsersService', 'RequestTypes', 'me',
    function($scope, $rootScope, $window, $http, $location, FriendsService, requests, bitcoin, UsersService, RequestTypes, me) {
        $window.wscope = $scope;
        if ($location.search().toId) {
            UsersService.getUserById($location.search().toId, function(user) {
                $scope.give = {
                    to: user
                };
            });
        } else {
            $scope.give = {
                to: $location.search().to,
                tnx: $location.search().tnx,
                sat: $location.search().sat,
                message: $location.search().message
            };
        }

        function isValidUser(value) {
            if (angular.isUndefined(value) || value === '') {
                return true;
            }
            return angular.isObject(value) ||
                ($scope.btcmode === 'sat' && /^[13][1-9A-HJ-NP-Za-km-z]{26,33}/.test(value));
        }

        function setSubmitDisabled(disabled) {
            $scope.submitDisabled = disabled;
        }

        var errHandler = function errHandler(err) {
            setSubmitDisabled(false);
            if (err) {
                $rootScope.errHandle(err);
            }
        };

        $scope.givemain = function() {
            function clearValues() {
                $scope.give = {};
                $scope.showErrors = false;
                setSubmitDisabled(false);
            }
            setSubmitDisabled(true);
            angular.element('#giveTo').controller('ngModel').$setValidity('user', isValidUser($scope.give.to));
            if (!$scope.giveForm.$valid) {
                setSubmitDisabled(false);
                $scope.showErrors = true;
                return;
            } else {
                $scope.showErrors = false;
            }
            if ($scope.btcmode == 'sat') {
                $scope.givebtc(clearValues);
            } else if ($scope.btcmode == 'dollar') {
                $scope.give.tnx = ((parseFloat($scope.give.dollar) * 100000000) / $rootScope.price).toFixed();
                $scope.givetnx(clearValues);
            } else if (!$scope.btcmode || $scope.btcmode == 'tnx') {
                $scope.givetnx(clearValues);
            }
        };
        $scope.givetnx = function(successCB) {

            if (!angular.isDefined(parseInt($scope.give.tnx))) {
                setSubmitDisabled(false);
                return;
            }
            var getter;
            if (angular.isObject($scope.give.to)) {
                getter = $scope.give.to;
            }
            if ($rootScope.user.id == getter.id) {
                $rootScope.message = {
                    body: 'you can\'t give to yourself',
                    canceltext: 'ok'
                };
                setSubmitDisabled(false);
                return;
            }
            if ($rootScope.user.tnx < parseInt($scope.give.tnx)) {
                    $rootScope.message = {
                        body: 'not enough thanx to give',
                        canceltext: 'ok'
                    };
                    setSubmitDisabled(false);
                    return;
            }

            function makeRequest() {
                $http.post('/mkrequest', {
                    tnx: parseInt($scope.give.tnx),
                    giveTo: getter.id,
                    message: $scope.give.message,
                    requestType: RequestTypes.GIVE
                })
                    .success(function(r) {
                        $rootScope.message = {
                            body: 'request sent!',
                            canceltext: 'cool tnx'
                        };
                        if (successCB) {
                            successCB();
                        }
                    })
                    .error(errHandler);
            }
            if (getter.username) {
                makeRequest();
            } else {
                $window.FB.ui({
                    method: 'apprequests',
                    to: getter.id,
                    message: 'I\'ve sent you ' + $scope.give.tnx + " thanx on bitconnect.\n" + ($scope.give.message && $scope.give.message.length > 0 ? $scope.give.message : 'It\'s a place where thanx means a lot.')
                }, function(req) {
                    if (angular.isDefined(req) && angular.isDefined(req.to)) {
                        $http.post('/mkinvite', {
                            from: $rootScope.user.id,
                            to: [getter.id],
                            reqid: req.request
                        })
                            .success(function() {
                                makeRequest();
                            }).error(errHandler);
                    } else {
                        setSubmitDisabled(false);
                    }
                });
            }
        };

        $scope.givebtc = function(successCB) {
            if (!parseInt($scope.give.sat) || parseInt($scope.give.sat) < 5430) return;
            var getter;
            if (angular.isObject($scope.give.to)) {
                getter = $scope.give.to;
            }
            if (!getter) {
                // regular expression for bitcoin address:
                var re = /^[13][1-9A-HJ-NP-Za-km-z]{26,33}/;
                if (re.test($scope.give.to) && $scope.btcmode === 'sat') {
                    $rootScope.bitcoinSend($scope.give.to, parseInt($scope.give.sat), 10000, $scope.give.message, undefined, errHandler);
                }
                return;
            }
            if ($rootScope.user.id == getter.id) {
                $rootScope.message = {
                    body: 'you can\'t give to yourself',
                    canceltext: 'ok'
                };
                setSubmitDisabled(false);
                return;
            }
            if (getter.username) {
                $rootScope.bitcoinSend(getter.username, parseInt($scope.give.sat), 10000, $scope.give.message, undefined, errHandler);
            } else {
                $window.FB.ui({
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
                            if (angular.isDefined(req) && angular.isDefined(req.to)) {
                                if (successCB) {
                                    successCB();
                                }
                            }
                        })
                        .error(errHandler);
                });
                //$rootScope.message = { body: getter.fullname + ' is not signed up, would you like to invite them? They will recieve your satoshi when they sign up.', canceltext: 'invite' }
            }
        };


        $scope.usersById = {}; // map of users filtered according to the current search

        angular.element('#giveTo').blur(function(e) {
            angular.element('#giveTo').controller('ngModel').$setValidity('user', isValidUser($scope.give.to));
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$watch('give.to', function() {
            if (isValidUser($scope.give.to)) {
                angular.element('#giveTo').controller('ngModel').$setValidity('user', true);
            }
            if (angular.isUndefined($scope.give) || angular.isUndefined($scope.give.to) || angular.isObject($scope.give.to) || $scope.give.to.length < 2) {
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
                if ($scope.usersById.hasOwnProperty(key) &&
                    UsersService.userFilter($scope.usersById[key], enteredText) &&
                    key !== $scope.user.id) {
                    res.push($scope.usersById[key]);
                }
            }
            return res;
        };
    }
]);