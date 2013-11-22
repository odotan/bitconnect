window.app.service('me',function($rootScope, $http) {

    window.rscope = $rootScope;

    this.getme = function() {
        $http.get('/me')
            .success(function(u) { 
                $rootScope.user = u
                $rootScope.firstname = $rootScope.user.fbUser.first_name.toLowerCase();
                $rootScope.lastname = $rootScope.user.fbUser.last_name.toLowerCase();
                if (!$rootScope.user.username) {
                    if ( window.location.href.indexOf('newaccount') == -1)
                        window.location.href = '/newaccount'
                }
                else {
                    if (window.location.href.indexOf('newaccount') >= 0) {
                        if ($rootScope.user.firstUse)
                            window.location.href = 'http://' + u.username + '.bitconnect.me/app/invitefriends';
                        else
                            window.location.href = 'http://' + u.username + '.bitconnect.me/app/give';
                    }
                }
             })
            .error(function(e) {
                console.log(e);
                if (e.result && e.result.error && e.result.error.code == 2500) {
                    $rootScope.user = {};
                    window.location.href = '/'
                }
            });
    }
    setInterval(this.getme,5000);
    this.getme();
});
