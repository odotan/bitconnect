window.app.service('HistoryService', ['$http',
    function($http) {
        var history,
        interactions = {};
        /*
         *   Fetches the history from the server.
         *   Calls the given callback with the results.
         */
        this.getHistory = function getHistory(cb) {
            $http.get('/rawhistory').success(function(h) {
                history = h;
                cb(h);
            });
        };
        
        this.getCachedHistory = function getCachedHistory() {
            if (history)
                return history;
            return null;
        };

        this.getHistoryItem = function getHistoryItem(id, cb) {
            var result,
                that = this,
                /**
                *   Find the item in the cached history object.
                *   Calls the callback and returns true if item was found, returns false otherwise.
                */
                findHistoryItem = function findHistoryItem() {
                    result = jQuery.grep(history, function(item) {
                        return item.id == id;
                    });
                    if (result[0]) {
                        cb(result[0]);
                        return true;
                    }
                    return false;
                };
            if (!history) {
                // no history is cached - go to server
                this.getHistory(findHistoryItem);
            }
            else if (!findHistoryItem()) {
                // history is cached but specific item not found
                this.getHistory(findHistoryItem);
            }
        };

        this.getInteractionWithUser = function getInteractionWithUser(otherUserId, cb) {
            $http.get('/interaction?otherUserId=' + otherUserId).success(function(result) {
                interactions[otherUserId] = result;
                cb(null, result);
            }).error(function(err) {
                cb(err);
            });
        };

        this.getCachedInteractionWithUser = function getCachedInteractionWithUser(otherUserId, cb) {
            if (interactions[otherUserId]) {
                return interactions[otherUserId];
            }
            return null;
        }
    }
]);