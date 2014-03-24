window.controllers.controller('SettingsController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

        window.wscope = $scope;

        $scope.sendtext = function sendtext() {
            if ($scope.smsInfo) {
                // clear previous error/success msg:
                $scope.smsInfo = '';
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
            if (angular.element('.phoneNumber input').hasClass('ng-invalid-pattern')) {
                $scope.smsInfo = 'invalid phone number';
                return;
            };
            if (!$scope.phonenum) {
                $scope.smsInfo = 'no mobile number entered';
                return;
            }

            $http.post('/sendsms', {
                phone: '+' + $scope.phonenum
            }).success(function() {
                $scope.smsInfo = 'SMS sent, enter verification code:';
            }).error(function() {
                $scope.smsInfo = 'an error occured, please try again';
            });
        };

        $scope.verify = function verify() {
            $http.post('/verifyaccount', {
                code: $scope.smscode
            }).success(function(res) {
                if (res.verified) {
                    $scope.user.verified = true;
                }
            }).error(function() {
                $scope.verificationError = 'wrong code. you may request another one above.'
            });
        }

        $scope.checkLogin = function(pw, check, callback) {
            if (pw != check) $rootScope.errHandle('passwords don\'t match');
            else $rootScope.bitcoinLogin(pw, callback);
        };

        $scope.buy = function() {
            if (angular.isUndefined($scope.amount) || $scope.amount < 10000)
                return $rootScope.errHandle("minimum buy 10000");
            if ($scope.amount > $scope.balance - 10000)
                return $rootScope.errHandle("not enough bts");

            var msg = "are you sure you want to buy " + $scope.amount + " satoshis";

            $rootScope.confirmDialog(msg, function() {
                $rootScope.buyTnx($scope.amount);
            });
        };

        $scope.logout = function() {
            $http.post('/logout').success(function() {
                window.location.href = '/';
            });
        };

        // Kill account (testing only)
        $scope.kill = function() {
            $http.post('/kill')
                .success(function(r) {
                    $rootScope.user = r;
                    location.href = '/app/newaccount';
                })
                .error(errhandle);
        };

        $scope.toggleChangeUsername = function toggleChangeUsername() {
            $scope.changingUsername = !$scope.changingUsername;
        }

        $scope.checkname = function() {
            $scope.newUsernameLegal = /^[a-zA-Z][0-9a-zA-Z_-]{3,15}$/.test($scope.newUsername);
            $http.post('/checkname', {
                name: $scope.newUsername + '.bitconnect.me'
            })
                .success(function(r) {
                    if (r == '"available"') $scope.newUsernameAvailable = true;
                    else $scope.newUsernameAvailable = false;
                })
                .error(errhandle);
        };

        $scope.changeUsername = function changeUsername() {
            $http.post('/changeusername', {
                username: $scope.newUsername + '.bitconnect.me'
            }).success(function(r) {
                $scope.changingUsername = false;
                me.getme();
            });
        }
        $scope.$watch('newUsername', function(value) {
            if(value) {
                $scope.checkname(value);
            }
        });
    }
]);