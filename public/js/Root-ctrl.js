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
    
    $scope.albums = [];

    var init = function() {
        $timeout(function() {
            var $c = $('#albums');
            $c.imagesLoaded(function() {
                $c.fadeIn();
                $c.isotope({
                    itemSelector: '.span3',
                    masonry: {
                        columnWidth: 300
                    }
                });
            });
        });
    };
    
    var getPage = function(pageUrl) {
        $http.jsonp(pageUrl).success(function(data) {
            console.log(data);
            $scope.albums.push.apply($scope.albums, data.data);
            if(data.paging.next!==undefined) {
                getPage(data.paging.next + '&callback=JSON_CALLBACK');
            } else {
                init();
            }
        });
    };

    var url = "https://graph.facebook.com/me/albums?limit=500&fields=id,name,cover_photo&callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;

    getPage(url);

}
AlbumsCtrl.$inject = ['$scope', '$http', '$timeout'];

function PhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('PhotosCtrl');

    $scope.confirmAuth();
    
    $scope.photos = [];

    var init = function() {
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                $c.fadeIn();
                $c.isotope({
                    itemSelector: '.span3',
                    masonry: {
                        columnWidth: 300
                    }
                });
            });
        });
    };
    
    var getPage = function(pageUrl) {
        $http.jsonp(pageUrl).success(function(data) {
            console.log(data);
            $scope.photos.push.apply($scope.photos, data.data);
            if(data.paging.next!==undefined) {
                getPage(data.paging.next + '&callback=JSON_CALLBACK');
            } else {
                init();
            }
        });
    };

    var url = "https://graph.facebook.com/" + $routeParams.albumId + "/photos?limit=500&fields=id,images&callback=JSON_CALLBACK&access_token=" + $scope.user.access_token;
    
    getPage(url);
    
    $scope.importPhotos = function() {
        $('#photos').isotope({filter: '.photoSelected'});
        $timeout(function(){
            $('#photos').fadeOut();
            $('h2#buttons').fadeOut();
            var photos = $scope.photos;
            var selectedPhotos = [];
            for(var i in photos) {
                if(photos[i].selected)
                    selectedPhotos.push(photos[i]);
            }
            $http.post('/me/photos', selectedPhotos).success(function(data) {
                console.log(data);
            });
            $scope.$parent.photos = selectedPhotos;
            $timeout(function(){
                $scope.changeHash('/me/photos');
            }, 500);
        }, 900);
    };
    
    $scope.selectAllPhotos = function() {
        for(var i in $scope.photos) {
            $scope.photos[i].selected = true;
        }
    };
    
    $scope.selectNoPhotos = function() {
        for(var i in $scope.photos) {
            $scope.photos[i].selected = false;
        }
    };

}
PhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];

function MyPhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('MyPhotosCtrl');

    $scope.confirmAuth();

    $http.get('/me/photos').success(function(data) {
        console.log(data);
        $scope.photos = data.photos;
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                $('#photos').fadeIn();
                $c.isotope({
                    itemSelector: '.span3',
                    masonry: {
                        columnWidth: 300
                    }
                });
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
                //$('#photos .span3').each(function(){
                //    $(this).zoomTarget({
                //        closeclick: true
                //    });
                //});
                $('.boxer').boxer();
            });
        }, 500);
    
    });

}
PhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];
