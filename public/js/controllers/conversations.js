window.controllers.controller('ConversationsController', ['$scope', '$rootScope', '$timeout', '$http', 'HistoryService', 'me', 'bitcoin', 'RequestTypes',
	function($scope, $rootScope, $timeout, $http, HistoryService, me, bitcoin, RequestTypes) {
		this.getConversations = function getConversations(firstTime) {
			function dumpConversation(c) {
				return {
					userId: c[c.otherUserKey].id,
					timestamp: c.timestamp
				};
			}
			if (firstTime) {
				var cachedConversations = HistoryService.getCachedConversations();
				if (cachedConversations) {
					$scope.conversations = cachedConversations;
					return;
				}
			}
			HistoryService.getConversations(function(err, conversations) {
				$scope.conversations = $scope.conversations || [];
				var oldConversations = $scope.conversations.map(dumpConversation);
				var newConversations = conversations.map(dumpConversation);
				if (!angular.equals(oldConversations, newConversations)) {
					$scope.conversations = conversations;
				}
			});
		};

		$scope.toggleMenu = function toggleMenu() {
			$rootScope.menuOpen = !$rootScope.menuOpen;
		}
		var timer = setInterval(this.getConversations, 5000),
			that = this;

		$timeout(function() {
			that.getConversations(true);
		});

		$scope.$on("$destroy", function() {
			clearInterval(timer);
		});
	}
]);