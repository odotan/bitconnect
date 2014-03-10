window.controllers.controller('ChatController', ['$scope', '$rootScope', '$routeParams', 'HistoryService', 'me', function($scope, $rootScope, $routeParams, HistoryService, me) {
    HistoryService.getInteractionWithUser($routeParams.otherUserId, function(interaction) {
    	$scope.interaction = interaction;
    	jQuery('.main').scrollTop(jQuery('.main')[0].scrollHeight);
    });
}]);
