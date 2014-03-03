'use strict';
describe('controllers', function() {
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
			id: '1',
			tnx: 25000
		};
		$rootScope.bitcoinSend = function() {};
		$scope.giveForm = {
			$valid: true
		}
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
	}
	RequestTypes = {
		'GET': 'GET',
		'GIVE': 'GIVE'
	}
	describe('GiveController', function() {
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
					var res = $controller('GiveController', {
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
			$scope.give = {
				to: 'Maya'
			}
			$scope.$apply();
			expect($scope.usersById['432432']).toBeDefined();
			expect($scope.usersById['123123']).toBeDefined();
			expect($scope.usersById['789987']).toBeDefined();
			expect($scope.usersById['1']).toBeUndefined();
		});

		it('should not send if the user tries to send to herself', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: {
					id: '1',
					fullname: 'My Name',
					username: 'myname.bitconnect.me'
				},
				sat: 12000,
				message: 'hi there'
			};
			$scope.givemain();
			expect($rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect($rootScope.bitcoinSend.callCount).toBe(0);
		});

		it('should not send if the user has insufficient balance', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '90210',
					fullname: 'Bruce Satoshi',
					username: 'bruce.bitconnect.me'
				},
				tnx: 35000,
				message: 'hello and goodbye'
			};
			expect($rootScope.message).toBeUndefined();
			$scope.givemain();
			expect($rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect($rootScope.bitcoinSend.callCount).toBe(0);
			expect($rootScope.message.body).toEqual('not enough thanx to give');
		});
		
		it('should not send when trying to send less than 5430 satoshi', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				sat: 5000,
				message: 'hello'
			};
			$scope.givemain();
			expect($rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect($rootScope.bitcoinSend.callCount).toBe(0);
		});

		it('should fill in form if controller is initialized with url params', function() {
			spyOn($location, 'search').andReturn({
				to: {
					id: '123123',
					fullname: 'Maya Cohen'
				},
				tnx: 2000,
				message: 'sincerely'
			});
			var controller = createController();
			expect($scope.give.to.id).toBe('123123');
			expect($scope.give.tnx).toBe(2000);
			expect($scope.give.message).toBe('sincerely');
		});

		it('should fetch user from service when id is given by url param', function() {
			spyOn($location, 'search').andReturn({
				toId: 777555
			});
			spyOn(UsersService, 'getUserById').andCallFake(function(userId, cb) {
				cb({
					id: '777555',
					fullname: 'Maya Cohen'
				});
			});
			var controller = createController();
			expect(UsersService.getUserById).toHaveBeenCalledWith(777555, jasmine.any(Function));
			expect($scope.give.to.id).toBe('777555')
		});

		it('should send correct requests when using givetnx method', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 13000,
				message: 'message'
			};
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 13000,
				giveTo: '432432',
				message: 'message',
				requestType: 'GIVE'
			})
				.respond('');
			$scope.givetnx();
			$httpBackend.flush();
		});

		it('should send invitation and request to server if user invited non signed up friend', function() {
			spyOn($window.FB, 'ui').andCallFake().andCallFake(function(obj, callback) {
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
				giveTo: '875412',
				message: 'my message',
				requestType: 'GIVE'
			}).respond('');
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '875412',
					fullname: 'Some Friend'
				},
				tnx: 21000,
				message: 'my message'
			};
			$scope.givemain();
			$httpBackend.flush();
		});

		it('should not send request or invitation if user didn\'t invite friend', function() {
			spyOn($window.FB, 'ui').andCallFake().andCallFake(function(obj, callback) {
				callback(undefined);
			});
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '875412',
					fullname: 'Some Friend'
				},
				tnx: 21000,
				message: 'my message'
			};
			$scope.givemain();
		});

		it('should send correct requests when using givebtc method', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: {
					id: '90210',
					fullname: 'Bruce Satoshi',
					username: 'bruce.bitconnect.me'
				},
				sat: 15000,
				message: 'hello and goodbye'
			};
			$scope.givebtc();

			expect($rootScope.bitcoinSend).toHaveBeenCalledWith('bruce.bitconnect.me', 15000, 10000, 'hello and goodbye', undefined, jasmine.any(Function));
			expect($rootScope.bitcoinSend.callCount).toBe(1);
		});

		it('should send correct requests when using givemain method to send thanx', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 13000,
				message: 'message'
			};
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 13000,
				giveTo: '432432',
				message: 'message',
				requestType: 'GIVE'
			})
				.respond('');
			$scope.givemain();
			$httpBackend.flush();
		});

		it('should send correct requests when using givemain method to send satoshi', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				sat: 20000,
				message: 'hello'
			};
			$scope.givemain();

			expect($rootScope.bitcoinSend).toHaveBeenCalledWith('maya.bitconnect.me', 20000, 10000, 'hello', undefined, jasmine.any(Function));
			expect($rootScope.bitcoinSend.callCount).toBe(1);

		});

		it('should send correct requests when sending to bitcoin address', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: '1B4HzATYyL5SYdhQt9TGQPHoY5qE2rRMP',
				sat: 10000
			}
			$scope.givemain();
			expect($rootScope.bitcoinSend).toHaveBeenCalledWith('1B4HzATYyL5SYdhQt9TGQPHoY5qE2rRMP', 10000, 10000, undefined, undefined, jasmine.any(Function));
			expect($rootScope.bitcoinSend.callCount).toBe(1);
		});

		it('should be able to send 0 thanx', function() {
			var controller = createController();
			$scope.btcmode = 'tnx';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				tnx: 0,
				message: 'message'
			};
			$httpBackend.expect('POST', '/mkrequest', {
				tnx: 0,
				giveTo: '432432',
				message: 'message',
				requestType: 'GIVE'
			})
				.respond('');
			$scope.givemain();
			$httpBackend.flush();
		});

		it('should not be able to send 0 satoshi', function() {
			var controller = createController();
			spyOn($rootScope, 'bitcoinSend').andReturn();
			$scope.btcmode = 'sat';
			$scope.give = {
				to: {
					id: '432432',
					fullname: 'Maya User',
					username: 'maya.bitconnect.me'
				},
				sat: 0,
				message: 'message'
			};

			$scope.givemain();
			expect($rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect($rootScope.bitcoinSend.callCount).toBe(0);
		});
	});
});