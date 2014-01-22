window.app.service('requests',function($rootScope, $http) {

    window.rscope = $rootScope;
    function updateIfChanged(key, value) {
        var newi = value.map(function(r) { return r.id }),
        oldi = ($rootScope[key] || []).map(function(r) { return r.id });
        if (JSON.stringify(newi) != JSON.stringify(oldi)) {
            $rootScope[key] = value;
            if (!$rootScope.$$phase) $rootScope.$apply();
        };
    }

    this.getrequests = function() {
        $http.get('/incomingrequests')
            .success(function(i){
                updateIfChanged('incomingRequests', i);
             });
        $http.get('/outgoingrequests')
            .success(function(i){
                updateIfChanged('outgoingRequests', i);
             });
    }
    setInterval(this.getrequests,5000);
    this.getrequests();
});
