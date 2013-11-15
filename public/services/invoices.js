window.app.service('invoices',function($rootScope, $http) {

    window.rscope = $rootScope;

    this.getinvoices = function() {
        $http.get('/invoices')
            .success(function(i) { 
                if (JSON.stringify(i) != JSON.stringify($rootScope.invoices)) {
                    $rootScope.invoices = i;
                    if (!$rootScope.$$phase) $rootScope.$apply();
                };
             })
    }
    setInterval(this.getinvoices,5000);
    this.getinvoices();
});
