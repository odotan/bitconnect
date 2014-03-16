describe('controllers', function() {
	'use strict';
	var $scope, $rootScope, $timeout, $httpBackend, $window, $rootElement, $location, createController, UsersService, FriendsService, RequestTypes;

	function putInitialDataOnScope() {
		$scope.usersById = {
			'172637462342': {
				id: '172637462342',
				include: true // 'include' key is only for testing
			},
			'23948293423': {
				id: '23948293423',
				include: false
			},
			'1': {
				id: '1', // my id - shouldn't be in result
				include: true
			}
		};
		$rootScope.user = {
			id: '1'
		};

		$scope.getForm = {
			$valid: true
		};
	}
	UsersService = {
		userFilter: function(user, text) {
			return user.include;
		},
		getUsersByPartialName: function() {},
		combineMaps: function(map1, map2) {
			return angular.extend(map1, map2);
		},
		getUserById: function(userId, cb) {}
	};
	FriendsService = {
		getFriendsByPartialName: function(name) {}
	};
	RequestTypes = {
		'GET': 'GET',
		'GIVE': 'GIVE'
	};
	describe('GetController', function() {
		beforeEach(function() {
			module('thanxbits.controllers');
			inject(function($injector) {

				$httpBackend = $injector.get('$httpBackend');
				$rootScope = $injector.get('$rootScope');
				$scope = $rootScope.$new();
				$rootElement = $injector.get('$rootElement');
				$timeout = $injector.get('$timeout');
				$location = $injector.get('$location');

				$window = {
					location: {},
					FB: {
						ui: function(obj, callback) {}
					}
				};
				var $controller = $injector.get('$controller');

				createController = function() {
					var res = $controller('GetController', {
						'$scope': $scope,
						'$window': $window,
						'friends': FriendsService,
						'requests': undefined,
						'bitcoin': undefined,
						'me': undefined,
						'UsersService': UsersService,
						'RequestTypes': RequestTypes,
						'$location': $location
					});
					putInitialDataOnScope();
					return res;
				};

			});
			spyOn(angular, 'element').andReturn({
				blur: function() {},
				controller: function() {
					return {
						$setValidity: function() {}
					};
				}
			});
		});
		afterEach(function() {
			$httpBackend.verifyNoOutstandingExpectation();
			$httpBackend.verifyNoOutstandingRequest();
		});

		it('should return the expected result when calling getFilteredUsers', inject(function() {
			spyOn(UsersService, 'userFilter').andCallThrough();

			var controller = createController();

			var res = $scope.getFilteredUsers('jack');
			expect(res.length).toBe(1);
			expect(res[0].id).toBe('172637462342');
			expect(UsersService.userFilter).toHaveBeenCalledWith(jasmine.any(Object), 'jack');
			expect(UsersService.userFilter.callCount).toBe(3);
		}));

		it('should not cause error when getFilteredUsers is called with empty data', function() {
			spyOn(UsersService, 'userFilter').andCallThrough();
			var controller = createController();
			expect($scope.getFilteredUsers(undefined)).toBeUndefined();
			expect($scope.getFilteredUsers('')).toBeUndefined();
			expect($scope.getFilteredUsers(null)).toBeUndefined();
		});

		it('should update usersById list after user changes text', function() {
			spyOn(FriendsService, 'getFriendsByPartialName').andCallFake(function(name) {
				return {
					'123123': {
						id: '123123',
						fullname: 'Maya Cohen'
					},
					'432432': {
						id: '432432',
						fullname: 'Maya Other'
					}
				};
			});
			spyOn(UsersService, 'getUsersByPartialName').andCallFake(function(name, cb) {
				cb({
					'789987': {
						id: '123123',
						fullname: 'Maya User'
					}
				});
			});
			var controller = createController();
			$scope.get = {
				from: 'Maya'
			};
			$scope.$apply();
			expect($scope.usersById['432432']).toBeDefined();
			expect($scope.usersById['123123']).toBeDefined();
			expect($scope.usersById['789987']).toBeDefined();
			expect($scope.usersById['1']).toBeUndefined();
		});

		it('should not send request if the user tries to get from herself', function() {
			var controller = createController();
			$scope.btcmode = 'sat';
			$scope.get = {
				from: {
					id: '1',
					fullname: 'My Name',
					username: 'myname.bitconnect.me'
				},
				sat: 12000,
				message: 'hi there'
			};
			$scope.getmain();
		});

		it('should fill in form if controller is initialized with url params', function() {
			spyOn($location, 'search').andReturn({
				from: {
					id: '123123',
					fullname: 'Maya Cohen'
				},
				tnx: 2000,
				message: 'sincerely'
			});
			var controller = createController();
			expect($scope.get.from.id).toBe('123123');
			expect($scope.get.tnx).toBe(2000);
			expect($scope.get.message).toBe('sincerely');
		});

		it('should fetch user from service when id is given by url param', function() {
			spyOn($location, 'search').andReturn({
				fromId: 777555
			});
			spyOn(UsersService, 'getUserById').andCallFake(function(userId, cb) {
				cb({
					id: '777555',
					fullname: 'Maya Cohen'
				});
			});
			var controller = createController();
			expect(UsersService.getUserById).toHaveBeenCalledWith(777555, jasmine.any(Function));
			expect($scope.get.from.id).toBe('777555');
		});

		it('should send correct requests when using gettnx method', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.get = {
				from: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 11000,
				message: 'message'
			};
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 11000,
				getFrom: '432432',
				message: 'message',
				requestType: 'GET'
			})
				.respond('');
			$scope.gettnx();
			$httpBackend.flush();
		});

		it('should send invitation and request to server if user invited non signed up friend', function() {
			spyOn($window.FB, 'ui').andCallFake(function(obj, callback) {
				callback({
					request: '213999',
					to: '875412'
				});
			});
			var controller = createController();
			$httpBackend.expect('POST', '/mkinvite', {
				from: '1',
				to: ['875412'],
				reqid: '213999'
			}).respond('');
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 21000,
				getFrom: '875412',
				message: 'my message',
				requestType: 'GET'
			}).respond('');
			$scope.btcmode = 'tnx';
			$scope.get = {
				from: {
					id: '875412',
					fullname: 'Some Friend'
				},
				tnx: 21000,
				message: 'my message'
			};
			$scope.getmain();
			$httpBackend.flush();
		});

		it('should not send request or invitation if user didn\'t invite friend', function() {
			spyOn($window.FB, 'ui').andCallFake().andCallFake(function(obj, callback) {
				callback(undefined);
			});
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.get = {
				from: {
					id: '875412',
					fullname: 'Some Friend'
				},
				tnx: 21000,
				message: 'my message'
			};
			$scope.getmain();
		});

		it('should send correct requests when using getbtc method', function() {
			var controller = createController();
			$scope.btcmode = 'sat';
			$httpBackend.expect('POST', '/mkrequest', {
				sat: 15000,
				getFrom: '90210',
				message: 'hello and goodbye',
				requestType: 'GET'
			}).respond('');
			$scope.get = {
				from: {
					id: '90210',
					fullname: 'Bruce Satoshi',
					username: 'bruce.bitconnect.me'
				},
				sat: 15000,
				message: 'hello and goodbye'
			};

			$scope.getbtc();

			$httpBackend.flush();
		});

		it('should send correct requests when using getmain method to request thanx', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.get = {
				from: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 13000,
				message: 'message'
			};
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 13000,
				getFrom: '432432',
				message: 'message',
				requestType: 'GET'
			})
				.respond('');
			$scope.getmain();
			$httpBackend.flush();
		});

		it('should send correct requests when using getmain method to request satoshi', function() {
			var controller = createController();
			$httpBackend.expect('POST', '/mkrequest', {
				sat: 20000,
				getFrom: '432432',
				message: 'hello',
				requestType: 'GET'
			})
				.respond('');
			$scope.btcmode = 'sat';
			$scope.get = {
				from: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				sat: 20000,
				message: 'hello'
			};
			$scope.getmain();
			$httpBackend.flush();
		});

		it('should not be able to request less than 5430 satoshi', function() {
			var controller = createController();
			$scope.btcmode = 'sat';
			$scope.get = {
				from: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				sat: 5429,
				message: 'hello'
			};
			$scope.getmain();
		});

		it('should not be able to request 0 thanx', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.get = {
				from: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 0,
				message: 'hello'
			};
			$scope.getmain();
		});
	});
});