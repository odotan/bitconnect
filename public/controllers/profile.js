function ProfileCtrl($scope, $rootScope, $http, $location) {

    window.wscope = $scope;

    $http.get('/picture')
         .success(function(r) {  $scope.picurl = r.replace(/\"/g,'') })

}
