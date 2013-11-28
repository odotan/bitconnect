window.app.service('friends',function($rootScope, $http) {

    window.rscope = $rootScope;
    console.log(123);

    $rootScope.getfriends = function() {
        $http.get('/friends')
            .success(function(f) {
                $rootScope.FBfriends = f;
             })
            .error(errhandle);
    }
    $rootScope.getfriends();
    setInterval(this.getfriends,5000);
})
 
