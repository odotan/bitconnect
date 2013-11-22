
function ThanxCtrl($scope, $http, $location) {

    window.wscope = $scope;

    $rootScope.message = {};

    $scope.checkname = function() {
        $http.post('/checkname',{ name:$scope.firstname+'.'+$scope.lastname })
            .success(function(r) {
                if (r == '"available"') $scope.available = true;
                else $scope.available = false;
             })
            .error(errhandle);
    }

    $scope.register = function() {
        $http.post('/register',{ name:$scope.firstname+'.'+$scope.lastname })
            .success(function(u) {
                $scope.user = u;
             })
            .error(errhandle);
    }

    $scope.showFriendsLimit = 30;

    $scope.getfriends = function() {
        $http.get('/friends')
            .success(function(f) {
                $scope.FBfriends = f;
             })
            .error(errhandle);
    }

    $scope.$watch('user.fbUser',$scope.getfriends);

    $scope.updateShowFriends = function() {
        var filter = function(f) {
            if ($scope.user.friends.indexOf(f.id) >= 0)
                return false;
            if (!$scope.searchstring)
                return true;
            var friendString = (f.first_name + ' ' + f.last_name).toLowerCase(),
                searchString = $scope.searchstring.toLowerCase();
            return friendString.indexOf(searchString) >= 0;
        }
        if ($scope.user && $scope.user.friends && $scope.FBfriends) {
            $scope.filteredFriends = $scope.FBfriends.filter(filter);
            $scope.showFriends = $scope.filteredFriends.slice(0,$scope.showFriendsLimit);
        }
    };

    $scope.$watch('FBfriends',$scope.updateShowFriends);
    $scope.$watch('searchstring',$scope.updateShowFriends);
    $scope.$watch('showFriendsLimit',$scope.updateShowFriends);

    setInterval(function() {
        if (!$scope.friends) return;
        if (window.pageYOffset > document.height - 1000 && $scope.showFriendsLimit < $scope.filteredFriends.length) {
            $scope.$apply(function() {
                $scope.showFriendsLimit += 40;
            });
        }
    },500);

    $scope.kill = function() {
        $http.post('/kill')
            .success(function(r) {
                $scope.user = r 
                $scope.checkname()
             })
            .error(errhandle);
    }

    $scope.selected = {}
    $scope.numselected = 0

    $scope.selectFriend = function(id) {
        if (!$scope.selected[id]) {
            $scope.selected[id] = true;
            $scope.numselected += 1;
        }
        else {
            delete $scope.selected[id];
            $scope.numselected -= 1;
        }
        if (!$scope.$$phase) { $scope.$apply() }
    }
    $scope.selectAll = function() {
        $scope.filteredFriends.map(function(f) {
            $scope.selected[f.id] = true;
        });
        $scope.numselected = $scope.filteredFriends.length;
    }
    $scope.selectNone = function() {
        $scope.selected = {};
        $scope.numselected = 0;
    }

    $scope.$watch('firstname',$scope.checkname)
    $scope.$watch('lastname',$scope.checkname)

    $scope.invite = function() {
        FB.ui({method: 'apprequests',
             to: Object.keys($scope.selected),
             title: 'Invite to Bitconnect', 
             message: 'Hey! I just invited you to Bitconnect. Do you want to join and get 54321 free satoshis? :)',
        }, function(req) { 
            console.log(req);
            $http.post('/mkinvite',{
                from: $scope.user.id, 
                to: Object.keys($scope.selected),
                reqid: req.request
            })
            .success(function(r) {
                $rootScope.message = {   
                    body: 'thanx a lot for inviting your friends. '+$scope.numselected+' invitations sent. you have gotten '+r.bonus+' thanxbits. don\'t forget to remind your friends to sign up. you will both get a lot more thanxbits when they do :)',
                    canceltext: 'cool thanx',
                    actiontext:  'i wanna invite more friends',
                    action: function(){ $rootScope.message = null }
                }
            });
        });
    }

    setInterval(me.getme,6000);
}

