var photo = angular.module('photo', []).
  config(['$routeProvider', function ($routeProvider) {
      $routeProvider.
      when('/', { templateUrl: 'partials/login.html', controller: RootCtrl }).
      when('/albums', { templateUrl: 'partials/albums.html', controller: AlbumsCtrl }).
      when('/albums/:albumId/photos', { templateUrl: 'partials/photos.html', controller: PhotosCtrl }).
      otherwise({ redirectTo: '/' });
  } ]);

function RootCtrl($scope, $location) {

    $scope.testVar = "krists";
    
    $scope.user = user;
    
    console.log($scope.user);
    console.log($scope.user.authenticated);
    
    if($scope.user.authenticated) {
        $location.path('/albums');
    } else {
        $location.path('/');
    }

}
RootCtrl.$inject = ['$scope', '$location'];

function AlbumsCtrl($scope, $http) {
    
    console.log('AlbumsCtrl');

    var url = "https://graph.facebook.com/me/albums?callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;

    $http.jsonp(url)
        .success(function (data) {
            console.log(data);
            $scope.albums = data.data;
        });

}
AlbumsCtrl.$inject = ['$scope', '$http'];

function PhotosCtrl($scope, $http, $routeParams) {

    var url = "https://graph.facebook.com/" + $routeParams.albumId + "/photos?callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;

    $http.jsonp(url)
        .success(function (data) {
            console.log(data);
            $scope.photos = data.data;
        });

}
PhotosCtrl.$inject = ['$scope', '$http', '$routeParams'];
