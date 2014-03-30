/**
 *   This service gets from the server all pending request that the user sent or recieved.
 *   Requests are divided according to request direction (incoming/outgoing) and request type (give/get).
 *   Request type is always regarding the request sender (e.g. a give request is a request where the sender wants to give).
 *   Request are put in $rootScope.pendingRequests in the following way:
 *        incoming: {
 *            get: [],
 *            give: []
 *        },
 *        outgoing: {
 *            get: [],
 *            give: []
 *        }
 */
angular.module('thanxbits').service('requests', ['$rootScope', '$http', 'RequestTypes', 'TxTypes', function($rootScope, $http, RequestTypes, TxTypes) {

    window.rscope = $rootScope;

    function updateIfChanged(value) {
        var oldIds = [],
            newIds = [];

        function pushOldReq(request) {
            oldIds.push(request);
        }

        function pushNewReq(request) {
            newIds.push(request);
        }
        angular.forEach($rootScope.pendingRequests.incoming.get, pushOldReq);
        angular.forEach($rootScope.pendingRequests.outgoing.get, pushOldReq);
        angular.forEach($rootScope.pendingRequests.incoming.give, pushOldReq);
        angular.forEach($rootScope.pendingRequests.outgoing.give, pushOldReq);

        angular.forEach(value.incoming.get, pushNewReq);
        angular.forEach(value.outgoing.get, pushNewReq);
        angular.forEach(value.incoming.give, pushNewReq);
        angular.forEach(value.outgoing.give, pushNewReq);

        if (angular.toJson(newIds) != angular.toJson(oldIds)) {
            $rootScope.pendingRequests = value;
            if (!$rootScope.$$phase) $rootScope.$apply();
        }
    }

    this.getrequests = function() {
        $http.get('/pendingrequests')
            .success(function(i) {
                updateIfChanged(i);
            });
    };

    $rootScope.pendingRequests = {
        incoming: {
            get: [],
            give: []
        },
        outgoing: {
            get: [],
            give: []
        }
    };
    setInterval(this.getrequests, 5000);
    this.getrequests();
    this.acceptRequest = function acceptRequest(request, successCB) {
        if (request.requestType === RequestTypes.GET) {
            if (!request) return;
            if (request.tnx > 0) {
                $rootScope.thanxSend(request.sender.username, request.tnx, request, request.message, TxTypes.getRequest, successCB);
            } else {
                $rootScope.bitcoinSend(request.sender.username, request.sat, null, request.message, request.id, function(err) {
                    if (err) {
                        $rootScope.errHandle(err);
                    } else if (successCB) {
                        successCB();
                    }
                });
            }
        } else if (request.requestType === RequestTypes.GIVE) {
            $rootScope.message = {
                body: 'get ' + request.tnx + ' thanx from ' + request.sender.username + '?',
                action: function() {
                    $http.post('/acceptgive', {
                        requestId: request.id
                    }).success(function() {
                        $rootScope.message = {};
                        if (successCB) {
                            successCB();
                        }
                    });
                },
                actiontext: 'yep',
                canceltext: 'nope'
            };
        }
    };

    this.rejectRequest = function rejectRequest(request, direction) {
        $rootScope.message = {
            body: direction == 'incoming' ?
                'are you sure you want to reject?' : 'are you sure you want to cancel your request?',
            action: function() {
                $http.post('/clearrequest', {
                    request_id: request.id
                })
                    .success(function() {
                        $rootScope.message = {
                            body: direction == 'incoming' ? 'rejected' : 'cancelled',
                            canceltext: 'cool thanx'
                        };
                    })
                    .error(function(e) {
                        $rootScope.message = {
                            body: e,
                            canceltext: 'cool thanx'
                        };
                    });
            },
            actiontext: 'yep',
            canceltext: 'nope'
        };
    };
}]);