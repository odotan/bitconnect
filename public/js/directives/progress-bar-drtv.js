app.directive('progressBar', [
function() {
	return {
		restrict: 'E',
		scope: {
			value: '='
		},
		template: '<img ng-src=\'/img/circlei.svg\' ng-repeat=\'i in getNumber() track by $index\'><img ng-src=\'/img/circle.svg\' ng-repeat=\'i in getComplementNumber() track by $index\'>',
		controller: ['$scope', function ProgressBarCtrl($scope) {
			$scope.getNumber = function getNumber() {
				if (!$scope.value) {
					return [];
				}
				return new Array($scope.value);
			};
			$scope.getComplementNumber = function getNumber() {
				if (!$scope.value) {
					return new Array(10);
				}
				return new Array(10 - $scope.value);
			};
		}]
	}
}]);