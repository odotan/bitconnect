window.app = angular.module('bitconnectProfile', ['bitconnectProfile.controllers','ngRoute']);
window.controllers = angular.module('bitconnectProfile.controllers', []);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
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

