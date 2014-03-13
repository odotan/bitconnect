window.controllers.controller('ChatController', ['$scope', '$rootScope', '$timeout', '$http', '$routeParams', 'HistoryService', 'me', 'bitcoin', 'RequestTypes',
	function($scope, $rootScope, $timeout, $http, $routeParams, HistoryService, me, bitcoin, RequestTypes) {
		this.getInteraction = function getInteraction(firstTime) {
			if (firstTime) {
				var cachedInteraction = HistoryService.getCachedInteractionWithUser($routeParams.otherUserId)
				if (cachedInteraction) {
					$scope.interaction = cachedInteraction;
					$timeout(function() {
						jQuery('.main').scrollTop(jQuery('.main')[0].scrollHeight);
					});
					return;

				}
			}
			HistoryService.getInteractionWithUser($routeParams.otherUserId, function(err, interaction) {
				if (!interaction) {
					$rootScope.goto('app/thanx');
				}
				$scope.interaction = $scope.interaction || [];
				var oldIds = $scope.interaction.map(function(i) {
					return i.id;
				});
				var newIds = interaction.map(function(i) {
					return i.id;
				});
				if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
					$scope.interaction = interaction;
					if (firstTime) {
						$timeout(function() {
							jQuery('.main').scrollTop(jQuery('.main')[0].scrollHeight);
						});
					}
				}
			});
		};

		$scope.tx = {};
		$scope.isMoneyTx = function isMoneyTx() {
			return ((!$scope.btcmode || $scope.btcmode == 'tnx') && $scope.tx.tnx) || ($scope.btcmode === 'sat' && $scope.tx.sat) || ($scope.btcmode === 'dollar' && $scope.tx.dollar);
		};

		function setSubmitDisabled(disabled) {
			$scope.submitDisabled = disabled;
		}

		function clearValues() {
			$scope.tx = {};
		}
				
		function errHandler(err) {
			setSubmitDisabled(false);
			if (err) {
				$rootScope.errHandle(err);
			}
		};

		function onRequestSend() {
			$rootScope.message = {
				body: 'request sent!',
				canceltext: 'cool tnx'
			}
			setSubmitDisabled(false);
			clearValues();
		}

		$scope.sendMessage = function sendMessage() {
			setSubmitDisabled(true);
			$http.post('/mkrequest', {
				tnx: 0,
				giveTo: $routeParams.otherUserId,
				message: $scope.tx.message,
				requestType: RequestTypes.GIVE
			})
				.success(function(r) {
					setSubmitDisabled(false);
					clearValues();
				})
				.error(errHandler);
		};

		$scope.give = function give() {
			setSubmitDisabled(true);
			if ((!$scope.btcmode || $scope.btcmode === 'tnx') && parseInt($scope.tx.tnx) > 0) {
				giveTnxNotSafe();
			} else if ($scope.btcmode == 'dollar' && parseFloat($scope.tx.dollar) > 0.01) {
				$scope.tx.tnx = ((parseFloat($scope.tx.dollar) * 100000000) / $rootScope.price).toFixed();
				giveTnxNotSafe();
			} else if ($scope.btcmode == 'sat' && parseFloat($scope.tx.sat) > 5430) {
				giveSatNotSafe();
			}
		};

		$scope.get = function get() {
			setSubmitDisabled(true);

			if ((!$scope.btcmode || $scope.btcmode === 'tnx') && parseInt($scope.tx.tnx) > 0) {
				getTnxNotSafe();
			} else if ($scope.btcmode == 'dollar' && parseFloat($scope.tx.dollar) > 0.01) {
				$scope.tx.tnx = ((parseFloat($scope.tx.dollar) * 100000000) / $rootScope.price).toFixed();
				getTnxNotSafe();
			} else if ($scope.btcmode == 'sat' && parseFloat($scope.tx.sat) > 5430) {
				getSatNotSafe();
			}
		};

		function getTnxNotSafe() {
			$http.post('/mkrequest', {
				tnx: parseInt($scope.tx.tnx),
				getFrom: $routeParams.otherUserId,
				message: $scope.tx.message,
				requestType: RequestTypes.GET
			})
				.success(onRequestSend)
				.error(errHandler);
		};

		function getSatNotSafe() {
			$http.post('/mkrequest', {
				sat: parseInt($scope.tx.sat),
				getFrom: $routeParams.otherUserId,
				message: $scope.tx.message,
				requestType: RequestTypes.GET
			})
				.success(onRequestSend)
				.error(errHandler);
		}

		function giveTnxNotSafe() {
			if ($rootScope.user.tnx < parseInt($scope.tx.tnx)) {
				$rootScope.message = {
					body: 'not enough thanx to give',
					canceltext: 'ok'
				}
				setSubmitDisabled(false);
				return;
			}
			$http.post('/mkrequest', {
				tnx: parseInt($scope.tx.tnx),
				giveTo: $routeParams.otherUserId,
				message: $scope.tx.message,
				requestType: RequestTypes.GIVE
			})
				.success(onRequestSend)
				.error(errHandler);
		}

		function giveSatNotSafe() {
			$rootScope.bitcoinSend($routeParams.otherUserId, parseInt($scope.tx.sat), 10000, $scope.tx.message, undefined, errHandler);
		}

		var timer = setInterval(this.getInteraction, 5000);
		this.getInteraction(true);
		$scope.$on("$destroy", function() {
			clearInterval(timer);
		});
	}
]);