window.controllers.controller('ChatController', ['$scope', '$rootScope', '$routeParams', 'HistoryService', 'me', 'bitcoin',
	function($scope, $rootScope, $routeParams, HistoryService, me, bitcoin) {
		this.getInteraction = function getInteraction(firstTime) {
			if (firstTime) {
				var cachedInteraction = HistoryService.getCachedInteractionWithUser($routeParams.otherUserId)
				if (cachedInteraction) {
					$scope.interaction = cachedInteraction;
					jQuery('.main').scrollTop(jQuery('.main')[0].scrollHeight);
					return;

				}
			}
			HistoryService.getInteractionWithUser($routeParams.otherUserId, function(interaction) {
				$scope.interaction = interaction;
				if (firstTime) {
					jQuery('.main').scrollTop(jQuery('.main')[0].scrollHeight);
				}
			});
		};
		setInterval(this.getInteraction, 5000);
		this.getInteraction(true)
	}
]);