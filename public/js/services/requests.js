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
window.app.service('requests', function($rootScope, $http) {

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

        if (JSON.stringify(newIds) != JSON.stringify(oldIds)) {
            $rootScope.pendingRequests = value;
            if (!$rootScope.$$phase) $rootScope.$apply();
        };
    }

    this.getrequests = function() {
        $http.get('/pendingrequests')
            .success(function(i) {
                updateIfChanged(i);
            });
    }
    $rootScope.pendingRequests = {
        incoming: {
            get: [],
            give: []
        },
        outgoing: {
            get: [],
            give: []
        }
    }
    setInterval(this.getrequests, 5000);
    this.getrequests();
});