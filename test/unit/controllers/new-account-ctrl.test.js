'use strict';
describe('controllers', function() {
	describe('NewAccountController', function() {
		var $scope, $rootScope, $httpBackend, $window, createController;
		beforeEach(function() {
			module('thanxbits.controllers');
			inject(function($injector) {
				$httpBackend = $injector.get('$httpBackend');
				$rootScope = $injector.get('$rootScope');
				$scope = $rootScope.$new();
				$window = {
					location: {}
				};
				var $controller = $injector.get('$controller');

				createController = function() {
					return $controller('NewAccountController', {
						'$scope': $scope,
						'$window': $window,
						'me': undefined
					});
				};
			});

		});
		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});
		it('should set scope variable \'available\' to true if server replies available', inject(function() {

			var controller = createController();
			$scope.available = false;
			// happens once after starting the controller
			$httpBackend.expect('POST' ,'/checkname')
				.respond('"available"');
			$httpBackend.flush();
			expect($scope.available).toBeTruthy();

			// and test checkname method
			$httpBackend.expect('POST' ,'/checkname')
				.respond('"available"');
			$scope.available = false;
			$scope.checkname();
			$httpBackend.flush();
				expect($scope.available).toBeTruthy();				
		}));

		it('should set scope variable \'available\' to false if server replies used', inject(function() {

			var controller = createController();
			$scope.available = true;
			// happens once after starting the controller
			$httpBackend.expect('POST' ,'/checkname')
				.respond('"used"');
			$httpBackend.flush();
			expect($scope.available).toBeFalsy();
			
			// and test checkname method
			$httpBackend.expect('POST' ,'/checkname')
				.respond('"used"');
			$scope.available = true;
			$scope.checkname();
			$httpBackend.flush();
			expect($scope.available).toBeFalsy();				
		}));

		it('should send register request after calling register method', inject(function() {
			$httpBackend.when('POST' ,'/checkname')
				.respond('"used"');
			var controller = createController();
			$scope.username = 'maya';
			$httpBackend.expect('POST' ,'/register', {name: 'maya.bitconnect.me'})
				.respond('');
			$scope.register();
			$httpBackend.flush();
			expect($window.location.href).toEqual('/app/us');

		}));
		
	});
});