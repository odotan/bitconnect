describe('controllers', function() {
	'use strict';
	var $scope, $rootScope, $timeout, createController, HistoryService;
	HistoryService = {
		getHistory: function() {},
		getCachedHistory: function() {}
	};
	describe('RequestController', function() {
		beforeEach(function() {
			module('thanxbits.controllers');
			inject(function($injector) {


				$rootScope = $injector.get('$rootScope');
				$scope = $rootScope.$new();
				$timeout = $injector.get('$timeout');

				var $controller = $injector.get('$controller');

				createController = function() {
					var res = $controller('RequestController', {
						'HistoryService': HistoryService,
						'$scope': $scope,
						'me': undefined,
						'bitcoin': undefined,
						'friends': undefined

					});
					return res;
				};

			});
		});

		it('should try to get the history from cache once the controller is initialized', function() {
			spyOn(HistoryService, 'getCachedHistory').andReturn([{
				name: 'item1'
			}, {
				name: 'item2'
			}]);
			spyOn(HistoryService, 'getHistory').andReturn();
			var controller = createController();
			expect(HistoryService.getCachedHistory).toHaveBeenCalled();
			expect(HistoryService.getCachedHistory.callCount).toBe(1);
			expect(HistoryService.getHistory).not.toHaveBeenCalled();
			expect($scope.history).toEqual([{
				name: 'item1'
			}, {
				name: 'item2'
			}]);
		});

		it('should history from server if cache returns nothing', function() {
			spyOn(HistoryService, 'getCachedHistory').andReturn();
			spyOn(HistoryService, 'getHistory').andCallFake(function(callback) {
				callback([{
					name: 'item3'
				}]);
			});
			var controller = createController();
			expect(HistoryService.getCachedHistory).toHaveBeenCalled();
			expect(HistoryService.getCachedHistory.callCount).toBe(1);
			expect(HistoryService.getHistory).toHaveBeenCalled();
			expect(HistoryService.getHistory.callCount).toBe(1);
			expect($scope.history).toEqual([{
				name: 'item3'
			}]);
		});


		it('should try to get the history from cache when using controller method', function() {
			var controller = createController();
			spyOn(HistoryService, 'getCachedHistory').andReturn([{
				name: 'item4'
			}, {
				name: 'item5'
			}]);
			spyOn(HistoryService, 'getHistory').andReturn();

			controller.gethistory(true);
			expect(HistoryService.getCachedHistory).toHaveBeenCalled();
			expect(HistoryService.getCachedHistory.callCount).toBe(1);
			expect(HistoryService.getHistory).not.toHaveBeenCalled();
			expect($scope.history).toEqual([{
				name: 'item4'
			}, {
				name: 'item5'
			}]);
		});

		it('should get hitory from server if cache returns nothing when using controller method', function() {
			var controller = createController();

			spyOn(HistoryService, 'getCachedHistory').andReturn();
			spyOn(HistoryService, 'getHistory').andCallFake(function(callback) {
				callback([{
					name: 'item6'
				}]);
			});

			controller.gethistory(true);

			expect(HistoryService.getCachedHistory).toHaveBeenCalled();
			expect(HistoryService.getCachedHistory.callCount).toBe(1);
			expect(HistoryService.getHistory).toHaveBeenCalled();
			expect(HistoryService.getHistory.callCount).toBe(1);
			expect($scope.history).toEqual([{
				name: 'item6'
			}]);
		});

		it('should not try to get from cache when tryCache param is false', function() {
			var controller = createController();

			spyOn(HistoryService, 'getCachedHistory').andReturn();
			spyOn(HistoryService, 'getHistory').andCallFake(function(callback) {
				callback([{
					name: 'item7'
				}]);
			});

			controller.gethistory(false);
			expect(HistoryService.getCachedHistory).not.toHaveBeenCalled();
			expect(HistoryService.getHistory).toHaveBeenCalled();
			expect(HistoryService.getHistory.callCount).toBe(1);
			expect($scope.history).toEqual([{
				name: 'item7'
			}]);

		});
	});
});