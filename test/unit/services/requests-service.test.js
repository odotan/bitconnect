describe('services', function() {
	'use strict';
	describe('requests service', function() {
		var service, request, httpBackend, rootScope;
		beforeEach(module('thanxbits'));
		beforeEach(inject(function($injector) {
			service = $injector.get('requests');
			rootScope = $injector.get('$rootScope');
			httpBackend = $injector.get('$httpBackend');
			request = {
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
			rootScope.thanxSend = function() {};
			rootScope.bitcoinSend = function() {};
			httpBackend.expect('GET', '/pendingrequests').respond({
				incoming: {
					get: [],
					give: []
				},
				outgoing: {
					get: [],
					give: []
				}
			});
		}));

		it('accept method should perform incoming get request with callback', function() {
			request.tnx = 10000;
			request.requestType = 'GET';
			request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			var callback = jasmine.createSpy();
			service.acceptRequest(request, callback);
			expect(rootScope.thanxSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, request, 'please', 'getRequest', callback);
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
		});
		it('accept method should perform incoming get request without callback', function() {
			request.tnx = 10000;
			request.requestType = 'GET';
			request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			service.acceptRequest(request);
			expect(rootScope.thanxSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, request, 'please', 'getRequest', undefined);
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
		});

		it('accept method should perform incoming satoshi get request with callback', function() {
			request.sat = 10000;
			request.requestType = 'GET';
			request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andCallFake(function(a, b, c, d, e, cb) {
				cb();
			});
			var callback = jasmine.createSpy();

			service.acceptRequest(request, callback);
			expect(rootScope.bitcoinSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, null, 'please', request.id, jasmine.any(Function));
			expect(callback).toHaveBeenCalled();
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
		});

		it('accept method should perform incoming satoshi get request without callback', function() {
			request.sat = 10000;
			request.requestType = 'GET';
			request.message = 'please';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andCallFake(function(a, b, c, d, e, cb) {
				cb();
			});

			service.acceptRequest(request);
			expect(rootScope.bitcoinSend).toHaveBeenCalledWith('jack.bitconnect.me', 10000, null, 'please', request.id, jasmine.any(Function));
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
		});
		
		it('accept method should perform incoming give request with callback', function() {
			request.sat = 11000;
			request.requestType = 'GIVE';
			request.message = 'money';
			spyOn(rootScope, 'thanxSend').andReturn();
			spyOn(rootScope, 'bitcoinSend').andReturn();
			var callback = jasmine.createSpy();
			service.acceptRequest(request, callback);
			expect(rootScope.message).not.toEqual({});
			rootScope.message.action();
			httpBackend.expect('POST', '/acceptgive', {
				requestId: 1
			}).respond('');
			httpBackend.flush();
			expect(callback).toHaveBeenCalled();
			expect(rootScope.message).toEqual({});
			expect(rootScope.bitcoinSend).not.toHaveBeenCalled();
			expect(rootScope.thanxSend).not.toHaveBeenCalled();
		});

		it('reject method should clear incoming request after user confirms', function() {
			request.sat = 12000;
			request.requestType = 'GET';
			service.rejectRequest(request, 'incoming');
			expect(rootScope.message.body).toEqual('are you sure you want to reject?');

			rootScope.message.action();
			httpBackend.expect('POST', '/clearrequest', {
				request_id: 1
			}).respond('');
			httpBackend.flush();
			expect(rootScope.message.body).toEqual('rejected');
		});

		it('reject method should clear outgoing request after user confirms', function() {
			request.sat = 12000;
			request.requestType = 'GET';

			service.rejectRequest(request, 'outgoing');
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