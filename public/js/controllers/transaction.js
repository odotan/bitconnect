window.controllers.controller('TransactionController', ['$scope', '$rootScope', '$routeParams', 'HistoryService', function($scope, $rootScope, $routeParams, HistoryService) {
    HistoryService.getHistoryItem($routeParams.id, function(historyItem) {
		$scope.historyItem = historyItem;
		$scope.timestamp = new Date(historyItem.timestamp * 1000);
    });
}]);
