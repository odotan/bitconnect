window.app.service('friends',function($rootScope, $http) {

    window.rscope = $rootScope;

    $rootScope.getfriends = function() {
        $http.get('/friends')
            .success(function(f) {
                $rootScope.FBfriends = f;
             })
            .error(function(e){
                errhandle();
                $rootScope.getfriends();
            })
    }
    $rootScope.getfriends();
    //setInterval(this.getfriends,5000);
})
 
