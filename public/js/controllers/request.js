window.controllers.controller('RequestController', ['$scope', '$rootScope', '$http', '$location', 'me', 'requests', 'bitcoin', 'friends',
    function($scope, $rootScope, $http, $location, me, requests, bitcoin, friends) {

        window.wscope = $scope;

        function acceptGiveRequest(requestId) {
            $http.post('/acceptgive', {
                requestId: requestId
            });
        }

        this.gethistory = function() {
            $http.get('/rawhistory')
                .success(function(h) {
                    // Do the object equality check so that we do not refresh unless we have to
                    var newh = h.map(function(x) {
                        return x.id
                    }),
                        oldh = ($scope.history || []).map(function(x) {
                            return x.id
                        });
                    if (JSON.stringify(newh) != JSON.stringify(oldh)) {
                        $scope.history = h
                    };
                })
        }
        setInterval(this.gethistory, 5000);
        this.gethistory();

        $scope.accept = function(request) {
            if (request.requestType === $rootScope.RequestTypes.GET) {
                if (!request) return;
                if (request.tnx > 0) {
                    $rootScope.thanxSend(request.sender.username, request.tnx, request, request.message, $rootScope.TxTypes.getRequest);
                } else {
                    $rootScope.bitcoinSend(request.sender.username, request.sat, null, request);
                }
            } else if (request.requestType === $rootScope.RequestTypes.GIVE) {
                acceptGiveRequest(request.id);
            }
            //TODO: clear handled requests
        }

        $scope.reject = function(request_id) {
            $rootScope.message = {
                body: 'are you sure you want to reject?',
                action: function() {
                    $http.post('/clearrequest', {
                        request_id: request_id
                    })
                        .success(function() {
                            $rootScope.message = {
                                body: 'rejected',
                                canceltext: 'cool thanx'
                            }
                        })
                        .error(function(e) {
                            $rootScope.message = {
                                body: e,
                                canceltext: 'cool thanx'
                            }
                        })
                },
                actiontext: 'yep',
                canceltext: 'nope'
            }
        }
    }
])