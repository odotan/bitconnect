window.controllers.controller('MeController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {
        $scope.closeMenu = function closeMenu() {
            $rootScope.menuOpen = false;
        }

        $scope.logout = function logout() {
            $http.post('/logout').success(function() {
                window.location.href = '/';
            });
        }
    }
]);