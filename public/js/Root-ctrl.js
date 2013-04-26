angular.module('photo', [ui.bootstrap]).
  config(['$routeProvider', function ($routeProvider) {
      $routeProvider.
      when('/', { templateUrl: 'partials/index.html', controller: RootCtrl }).
      when('/albums', { templateUrl: 'partials/albums.html', controller: AlbumsCtrl }).
      when('/albums/:albumId/photos', { templateUrl: 'partials/photos.html', controller: PhotosCtrl }).
      otherwise({ redirectTo: '/' });
  } ]);

function RootCtrl($scope) {

    $scope.testVar = "krists";

}
RootCtrl.$inject = ['$scope'];

function AlbumsCtrl($scope) {

    var url = "https://graph.facebook.com/me/albums?callback=JSON_CALLBACK&access_token=" + user.access_token;

    $http.jsonp(url)
        .success(function (data) {
            console.log(data);
        });

}
AlbumsCtrl.$inject = ['$scope', '$http'];

function PhotosCtrl($scope, $routeParams) {

    var url = "https://graph.facebook.com/" + $routeParams.albumId + "/photos?callback=JSON_CALLBACK&access_token=" + user.access_token;

    $http.jsonp(url)
        .success(function (data) {
            console.log(data);
        });

}
PhotosCtrl.$inject = ['$scope', '$http', '$routeParams'];

<!-- Albums partial -->
<div class="row">   
    <div class="span9">
        <div class="span3" data-ng-repeat="">
            <a href="#/albums/id/photos"><img src="" alt="" title=""></a>
        </div>
    </div>
</div>
