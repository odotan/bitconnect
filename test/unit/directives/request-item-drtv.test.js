'use strict';
describe('directives', function() {
	var $scope, httpBackend, rootScope, elm;
	describe('requestItem', function() {
		beforeEach(module('thanxbits'));
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

		it('accept method should perform incoming get request', function() {
			$scope.request.tnx = 10000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			compileDirective();
			elm.isolateScope().accept();
			expect(rootScope.thanxSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, $scope.request, 'please', 'getRequest');
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
		});

		it('accept method should perform incoming satoshi get request', function() {
			$scope.request.sat = 10000;
			$scope.request.requestType = 'GET';
			$scope.request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			compileDirective();
			elm.isolateScope().accept();
			expect(rootScope.bitcoinSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, null, 'please', $scope.request.id);
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
		});

		it('accept method should perform incoming give request', function() {
			$scope.request.sat = 11000;
			$scope.request.requestType = 'GIVE';
			$scope.request.message = 'money';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			compileDirective();
			elm.isolateScope().accept();
			expect(rootScope.message).not.toEqual({});
			rootScope.message.action();
			httpBackend.expect('POST', '/acceptgive', {
				requestId: 1
			}).respond('');
			httpBackend.flush();
			expect(rootScope.message).toEqual({});
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
		});

		it('reject method should clear should clear incoming request after user confirms', function() {
			$scope.request.sat = 12000;
			$scope.request.requestType = 'GET';
			compileDirective();
			elm.isolateScope().reject();
			expect(rootScope.message.body).toEqual('are you sure you want to reject?');

			rootScope.message.action();
			httpBackend.expect('POST', '/clearrequest', {
				request_id: 1
			}).respond('');
			httpBackend.flush();
			expect(rootScope.message.body).toEqual('rejected');
		});

		it('reject method should clear should clear outgoing request after user confirms', function() {
			$scope.request.sat = 12000;
			$scope.request.requestType = 'GET';
			compileDirective('<request-item dir=\'outgoing\' request=\'request\' />');

			elm.isolateScope().reject();
			expect(rootScope.message.body).toEqual('are you sure you want to cancel your request?');

			rootScope.message.action();
			httpBackend.expect('POST', '/clearrequest', {
				request_id: 1
			}).respond('');
			httpBackend.flush();
			expect(rootScope.message.body).toEqual('cancelled');
		});
	});
});