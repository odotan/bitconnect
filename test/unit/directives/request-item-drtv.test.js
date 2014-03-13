'use strict';
describe('directives', function() {
	var $scope, httpBackend, rootScope, elm, requestsService;
	requestsService = {
		acceptRequest: function() {},
		rejectRequest: function() {}
	};
	describe('requestItem', function() {
		beforeEach(module('thanxbits'));
		beforeEach(module('thanxbits.controllers'));
		beforeEach(module(function($provide) {
			$provide.value('requests', requestsService);
		}));
		beforeEach(inject(function($rootScope, $compile, $httpBackend) {
			rootScope = $rootScope;
			rootScope.thanxSend = function() {};
			rootScope.bitcoinSend = function() {};
			httpBackend = $httpBackend;
			$scope = $rootScope.$new();
			$scope.request = {
				sender: {
					username: 'jack.bitconnect.me',
					fbUser: {
						first_name: 'Jack',
						last_name: 'Last'
					}
				},
				recipient: {
					username: 'dee.bitconnect.me',
					fbUser: {
						first_name: 'Donald',
						last_name: 'Bleer'
					}
				},
				id: 1
			};
		}));

		function compileDirective(template) {
			template = template || '<request-item dir=\'incoming\' request=\'request\' />';
			inject(function($compile) {
				elm = $compile(angular.element(template))($scope);
			});
			$scope.$digest();
		}
		afterEach(function() {
			httpBackend.verifyNoOutstandingExpectation();
			httpBackend.verifyNoOutstandingRequest();
		});

		it('should display an incoming get request', function() {
			$scope.request.tnx = 10000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'please';

			compileDirective();
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=jack.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Jack Last');
			expect(elm.find('div.tnx').length).toBe(1);
			expect(elm.find('div.tnx').text()).toBe('10,000 thanx');
			expect(elm.find('div.sat').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('please');
			expect(elm.find('span.accept img').length).toBe(1);
			expect(elm.find('span.accept img').attr('src')).toBe('/img/give.png');
			expect(elm.find('span.reject img').length).toBe(1);
		});

		it('should display an incoming give request', function() {
			$scope.request.tnx = 11000;
			$scope.request.requestType = 'GIVE';
			$scope.request.message = 'my pleasure';

			compileDirective();
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=jack.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Jack Last');
			expect(elm.find('div.tnx').length).toBe(1);
			expect(elm.find('div.tnx').text()).toBe('11,000 thanx');
			expect(elm.find('div.sat').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('my pleasure');
			expect(elm.find('span.accept img').length).toBe(1);
			expect(elm.find('span.accept img').attr('src')).toBe('/img/get.png');
			expect(elm.find('span.reject img').length).toBe(1);
		});
		it('should display an outgoing get request', function() {
			$scope.request.tnx = 12000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'money';
			compileDirective('<request-item dir=\'outgoing\' request=\'request\' />');
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=dee.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Donald Bleer');
			expect(elm.find('div.tnx').length).toBe(1);
			expect(elm.find('div.tnx').text()).toBe('12,000 thanx');
			expect(elm.find('div.sat').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('money');
			expect(elm.find('span.accept img').length).toBe(0);
			expect(elm.find('span.reject img').length).toBe(1);
		});

		it('should display an outgoing give request', function() {
			$scope.request.tnx = 9000;
			$scope.request.requestType = 'GIVE';
			$scope.request.message = 'my message';
			compileDirective('<request-item dir=\'outgoing\' request=\'request\' />');
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=dee.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Donald Bleer');
			expect(elm.find('div.tnx').length).toBe(1);
			expect(elm.find('div.tnx').text()).toBe('9,000 thanx');
			expect(elm.find('div.sat').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('my message');
			expect(elm.find('span.accept img').length).toBe(0);
			expect(elm.find('span.reject img').length).toBe(1);
		});

		it('should display an incoming satoshi request', function() {
			$scope.request.sat = 10000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'please';
			compileDirective();
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=jack.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Jack Last');
			expect(elm.find('div.sat').length).toBe(1);
			expect(elm.find('div.sat').text()).toBe('10,000 satoshi');
			expect(elm.find('div.tnx').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('please');
			expect(elm.find('span.accept img').length).toBe(1);
			expect(elm.find('span.accept img').attr('src')).toBe('/img/give.png');
			expect(elm.find('span.reject img').length).toBe(1);
		});

		it('should display an outgoing satoshi give request', function() {
			$scope.request.sat = 9000;
			$scope.request.requestType = 'GIVE';
			$scope.request.message = 'my message';
			compileDirective('<request-item dir=\'outgoing\' request=\'request\' />');
			expect(elm.find('img.friendImg').length).toBe(1);
			expect(elm.find('img.friendImg').attr('ng-src')).toContain('/pic?username=dee.bitconnect.me');
			expect(elm.find('div.fbname').text()).toBe('Donald Bleer');
			expect(elm.find('div.sat').length).toBe(1);
			expect(elm.find('div.sat').text()).toBe('9,000 satoshi');
			expect(elm.find('div.tnx').length).toBe(0);
			expect(elm.find('div.message').length).toBe(1);
			expect(elm.find('div.message').text()).toBe('my message');
			expect(elm.find('span.accept img').length).toBe(0);
			expect(elm.find('span.reject img').length).toBe(1);
		});
		it('accept method should call request service method', function() {
			$scope.request.tnx = 10000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'please';
			spyOn(requestsService, 'acceptRequest').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			spyOn(rootScope, 'thanxSend').andReturn();
			compileDirective();
			elm.isolateScope().accept();
			expect(requestsService.acceptRequest).toHaveBeenCalledWith($scope.request, jasmine.any(Function));
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
		});

		it('reject incoming request should call request service method', function() {
			$scope.request.sat = 12000;
			$scope.request.requestType = 'GET';
			compileDirective();
			spyOn(requestsService, 'rejectRequest').andReturn();
			elm.isolateScope().reject();
			expect(requestsService.rejectRequest).toHaveBeenCalledWith($scope.request, 'incoming');
		});

		it('reject outgoing request should call request service method', function() {
			$scope.request.sat = 12000;
			$scope.request.requestType = 'GET';
			compileDirective('<request-item dir=\'outgoing\' request=\'request\' />');
			spyOn(requestsService, 'rejectRequest').andReturn();
			elm.isolateScope().reject();
			expect(requestsService.rejectRequest).toHaveBeenCalledWith($scope.request, 'outgoing');
		});
	});
});