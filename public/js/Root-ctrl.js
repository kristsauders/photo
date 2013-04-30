var photo = angular.module('photo', []).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'partials/login.html',
        controller: RootCtrl
    }).
    when('/albums', {
        templateUrl: 'partials/albums.html',
        controller: AlbumsCtrl
    }).
    when('/albums/:albumId/photos', {
        templateUrl: 'partials/photos.html',
        controller: PhotosCtrl
    }).
    when('/me/photos', {
        templateUrl: 'partials/myPhotos.html',
        controller: MyPhotosCtrl
    }).
    otherwise({
        redirectTo: '/'
    });
}]);

function RootCtrl($scope, $location) {

    $scope.testVar = "krists";

    $scope.user = user;

    console.log($scope.user);
    console.log($scope.user.authenticated);

    $scope.confirmAuth = function() {
        if ($scope.user.authenticated) {}
        else {
            $location.path('/');
        }
    };

    $scope.confirmAuth();
    
    $scope.changeHash = function(hash) {
        $location.path(hash);
    };

}
RootCtrl.$inject = ['$scope', '$location'];

function AlbumsCtrl($scope, $http, $timeout) {

    console.log('AlbumsCtrl');

    $scope.confirmAuth();

    var url = "https://graph.facebook.com/me/albums?callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;

    $http.jsonp(url).success(function(data) {
        console.log(data);
        $scope.albums = data.data;
        $timeout(function() {
            var $c = $('#albums');
            $c.imagesLoaded(function() {
                $c.isotope({
                    itemSelector: '.span3',
                    masonry: {
                        columnWidth: 300
                    }
                });
                $('#albums .span3').each(function(){$(this).fadeIn()});
            });
        });
    });

}
AlbumsCtrl.$inject = ['$scope', '$http', '$timeout'];

function PhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('PhotosCtrl');

    $scope.confirmAuth();

    var url = "https://graph.facebook.com/" + $routeParams.albumId + "/photos?callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;

    $http.jsonp(url).success(function(data) {
        console.log(data);
        $scope.photos = data.data;
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                $c.isotope({
                    itemSelector: '.span3',
                    masonry: {
                        columnWidth: 300
                    }
                });
                $('#photos .span3').each(function(){$(this).fadeIn()});
            });
        });
    });
    
    $scope.importPhotos = function() {
        $('#photos').isotope({filter: '.photoSelected'});
        //$scope.changeHash('/me/photos');
    };

}
PhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];

function MyPhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('MyPhotosCtrl');

    $scope.confirmAuth();

    $timeout(function() {
        var $c = $('#photos');
        $c.imagesLoaded(function() {
            $c.isotope({
                itemSelector: '.span3',
                masonry: {
                    columnWidth: 300
                }
            });
            $('#photos .span3').each(function(){$(this).fadeIn()});
            $('#photos .span3').resizable({
                grid: 300,
                aspectRatio: true,
                start: function(event, ui) {
                    $(this).css('z-index', 999);
                },
                stop: function(event, ui) {
                    $(this).css('z-index', 2);
                    $c.isotope('reLayout');
                }
            });
        });
    });

}
PhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];
