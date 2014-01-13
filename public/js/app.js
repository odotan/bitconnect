window.app = angular.module('thanxbits', ['ui.bootstrap.typeahead', 'thanxbits.controllers', 'infinite-scroll', 'ngRoute']);

window.controllers = angular.module('thanxbits.controllers', []);

var el = function(x) { return document.getElementById(x); }
var qs = function(x) { return document.querySelectorAll(x); }

var errhandle = function(r) { console.log("Error",r); }

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/app/give', {
        templateUrl: '/partials/give',
        controller: 'GiveController'
    })
    .when('/app/get', {
        templateUrl: '/partials/get',
        controller: 'GetController'
    })
    .when('/app/thanx', {
        templateUrl: '/partials/requests',
        controller: 'RequestController'
    })
    .when('/app/transaction/:id', {
        templateUrl: '/partials/transaction',
        controller: 'TransactionController'
    })
    .when('/app/me', {
        templateUrl: '/partials/settings',
        controller: 'SettingsController'
    })
    .when('/app/us', {
        templateUrl: '/partials/invitefriends',
        controller: 'InviteFriendsController'
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
        redirectTo: '/'
    });
}]).config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);

app.run(function($rootScope, $location) {
    $rootScope.goto = function(path, searchValues) {
        if (window.location.pathname.indexOf(path) == -1) {
            $location.path('/app/'+path);
            if (searchValues) {
                $location.search(searchValues);
            }
	   }
    }
    $rootScope.path = function() {
        var p = window.location.pathname.split('/')
        return p[p.length-1];
    }
    $rootScope.message = {};

    $rootScope.errHandle = function(msg) {
        $rootScope.message = {
            body: msg || 'error',
            canceltext: 'cool, thanx'
        }
    }
    $rootScope.confirmDialog = function(msg,action) {
        $rootScope.message = {
            body: msg,
            action: action,
            actiontext: 'yes please',
            canceltext: 'no thanx'
        }
    }
    $rootScope.showMessage = function(msg) {
        $rootScope.message = {
            body: msg || 'success',
            canceltext: 'cool, thanx'
        }
    }
});
