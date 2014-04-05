window.app = angular.module('thanxbits', ['ui.bootstrap', 'thanxbits.controllers', 'infinite-scroll', 'ngRoute']);

window.controllers = angular.module('thanxbits.controllers', []);

var el = function(x) {
    return document.getElementById(x);
};
var qs = function(x) {
    return document.querySelectorAll(x);
};

var errhandle = function(r) {
    console.log("Error", r);
};

window.app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider
            .when('/app/connect', {
                templateUrl: '/partials/connect',
                controller: 'InviteFriendsController'
            })
            .when('/app/conversations', {
                templateUrl: '/partials/conversations',
                controller: 'ConversationsController'
            })
            .when('/app/thanx', {
                templateUrl: '/partials/requests',
                controller: 'RequestController'
            })
            .when('/app/chat/:otherUserId', {
                templateUrl: '/partials/chat',
                controller: 'ChatController'
            })
            .when('/app/transaction/:id', {
                templateUrl: '/partials/transaction',
                controller: 'TransactionController'
            })
            .when('/app/me', {
                templateUrl: '/partials/settings',
                controller: 'SettingsController'
            })
            .when('/app/newaccount', {
                templateUrl: '/partials/newaccount',
                controller: 'NewAccountController'
            })
            .when('/profile/:userId', {
                templateUrl: '/partials/profile',
                controller: 'ProfileCtrl'
            })
            .otherwise({
                redirectTo: '/app/thanx'
            });
    }
]).config(['$locationProvider',
    function($locationProvider) {
        $locationProvider.html5Mode(true);
    }
]);

window.app.run(['$rootScope', '$location',
    function($rootScope, $location) {
        $rootScope.goTo = function(path, searchValues) {
            if (window.location.pathname.indexOf(path) == -1) {
                $location.path('/app/' + path);
                if (searchValues) {
                    $location.search(searchValues);
                }
            }
        };
        $rootScope.path = function() {
            var p = window.location.pathname.split('/');
            return p[p.length - 1];
        };
        $rootScope.message = {};

        $rootScope.errHandle = function(msg) {
            $rootScope.message = {
                body: msg || 'error',
                canceltext: 'cool, thanx'
            };
        };
        $rootScope.confirmDialog = function(msg, action) {
            $rootScope.message = {
                body: msg,
                action: action,
                actiontext: 'yes please',
                canceltext: 'no thanx'
            };
        };
        $rootScope.showMessage = function(msg) {
            $rootScope.message = {
                body: msg || 'success',
                canceltext: 'cool, thanx'
            };
        };
    }
]);