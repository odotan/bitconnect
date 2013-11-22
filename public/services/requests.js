window.app.service('requests',function($rootScope, $http) {

    window.rscope = $rootScope;

    this.getrequests = function() {
        $http.get('/requests')
            .success(function(i) { 
                // Do the object equality check so that we do not refresh unless we have to
                var newi = i.map(function(r) { return r.id }),
                    oldi = ($rootScope.requests || []).map(function(r) { return r.id });
                if (JSON.stringify(newi) != JSON.stringify(oldi)) {
                    $rootScope.requests = i;
                    if (!$rootScope.$$phase) $rootScope.$apply();
                };
             })
    }
    setInterval(this.getrequests,5000);
    this.getrequests();
});
