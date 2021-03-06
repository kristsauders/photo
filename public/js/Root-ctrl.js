var photo = angular.module('photo', []).
config(['$routeProvider', function($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'partials/myAlbums.html',
        controller: MyAlbumsCtrl
    }).
    when('/login', {
        templateUrl: 'partials/login.html'
    }).
    when('/import/:myAlbumId/facebook/albums', {
        templateUrl: 'partials/albums.html',
        controller: AlbumsCtrl
    }).
    when('/import/:myAlbumId/facebook/albums/:albumId/photos', {
        templateUrl: 'partials/photos.html',
        controller: PhotosCtrl
    }).
    when('/me/photos', {
        templateUrl: 'partials/myPhotos.html',
        controller: MyPhotosCtrl
    }).
    when('/me/albums', {
        templateUrl: 'partials/myAlbums.html',
        controller: MyAlbumsCtrl
    }).
    when('/me/albums/new', {
        templateUrl: 'partials/newAlbum.html',
        controller: NewAlbumCtrl
    }).
    when('/me/albums/:albumId/photos', {
        templateUrl: 'partials/myPhotos.html',
        controller: MyAlbumPhotosCtrl
    }).
    otherwise({
        redirectTo: '/'
    });
}]);

function RootCtrl($scope, $location, $timeout, $routeProvider) {

    $scope.$location = $location;
    $scope.$route = $routeProvider;

    $scope.user = user;

    console.log($scope.user);
    console.log($scope.user.authenticated);

    $scope.confirmAuth = function() {
        if ($scope.user.authenticated) {}
        else {
            $location.path('/login');
        }
    };

    $scope.confirmAuth();
    
    $scope.changeHash = function(hash) {
        console.log('changing hash to: ' + hash);
        $location.path(hash);
    };
    
    // Animate view fading out before changing route
    $scope.$on('$locationChangeStart', function(event, next, current) {
        // Prevent route change if view is still visible or this is initial page load
        if($('#view').css('display') != 'none' && current !== next) {
            event.preventDefault();
        }
        $('#view').fadeOut(500);
        $timeout(function(){
            $location.path(next.split('#').pop());
        }, 500);
    });
    
    // Animate view fading in on route change success
    $scope.$on('$routeChangeSuccess', function (scope, next, current) {
        $('#view').fadeIn(500);
    });
    
    // Trigger loading of next page on scroll to bottom
    var killScroll = false;
    $(window).scroll(function(){
            if  ($(window).scrollTop() >= ($(document).height() - ($(window).height()))){
                    if (!killScroll) {
                        killScroll = true;
                        if($('#loadMoreButton').hasClass('clickable')) {
                            $('#loadMoreButton').click();
                        }
                    }
            } else {
                if(killScroll) {
                    $timeout(function(){
                        killScroll = false;
                    }, 1000);
                }
            }
    });
    
    // Prevent links opening in safari when in full screen web app mode on iPhone
    (function(a,b,c){if(c in b&&b[c]){var d,e=a.location,f=/^(a|html)$/i;a.addEventListener("click",function(a){d=a.target;while(!f.test(d.nodeName))d=d.parentNode;"href"in d&&(d.href.indexOf("http")||~d.href.indexOf(e.host))&&(a.preventDefault(),e.href=d.href)},!1)}})(document,window.navigator,"standalone")

}
RootCtrl.$inject = ['$scope', '$location', '$timeout', '$route'];

function AlbumsCtrl($scope, $http, $timeout) {

    console.log('AlbumsCtrl');

    $scope.confirmAuth();
    
    $scope.albums = [];
    
    var page = 0;

    function init() {
        $timeout(function() {
            var $c = $('#albums');
            $c.imagesLoaded(function() {
                $('.loading').fadeOut(100);
                $('#albums .span3').fadeIn(500);
                $c.isotope({
                    itemSelector: '.span3',
                    //masonry: {
                    //    columnWidth: 65
                    //}
                });
            });
        });
    }
    
    function getPage(pageUrl) {
        pageUrl += "&callback=JSON_CALLBACK";
        $http.jsonp(pageUrl).success(function(data) {
            console.log(data);
            page += 1;
            $scope.albums.push.apply($scope.albums, data.data);
            $scope.nextPage = data.paging.next;
            if(page===1) {
                init();
            } else {
                $timeout(function(){
                    $('#albums').imagesLoaded(function(){
                        $("#albums .span3:not('.isotope-item')").show();
                        $('#albums').isotope('appended', $("#albums .span3:not('.isotope-item')"));
                    });
                });
            }
        });
    }
    
    $scope.getNextPage = function() {
        getPage($scope.nextPage);
    };

    var url = "https://graph.facebook.com/me/albums?limit=25&fields=id,name,count,cover_photo&access_token=" + $scope.user.access_token;

    getPage(url);
    
    window.onorientationchange = function() {
        $('#albums').isotope('reLayout');
    }

}
AlbumsCtrl.$inject = ['$scope', '$http', '$timeout'];

function PhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('PhotosCtrl');

    $scope.confirmAuth();
    
    $scope.photos = [];
    
    var page = 0;

    function init() {
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                $('.loading').fadeOut(100);
                $('#photos .span3').fadeIn(500);
                $c.isotope({
                    itemSelector: '.span3',
                    //masonry: {
                    //    columnWidth: 65
                    //}
                });
            });
        });
    }
    
    function getPage(pageUrl) {
        pageUrl += "&callback=JSON_CALLBACK";
        $http.jsonp(pageUrl).success(function(data) {
            console.log(data);
            page += 1;
            $scope.photos.push.apply($scope.photos, data.data);
            $scope.nextPage = data.paging.next;
            if(page===1) {
                init();
            } else {
                $timeout(function(){
                    $('#photos').imagesLoaded(function(){
                        $("#photos .span3:not('.isotope-item')").show();
                        $('#photos').isotope('appended', $("#photos .span3:not('.isotope-item')"));
                    });
                });
            }
        });
    }
    
    $scope.getNextPage = function() {
        getPage($scope.nextPage);
    };

    var url = "https://graph.facebook.com/" + $routeParams.albumId + "/photos?limit=25&fields=id,images&access_token=" + $scope.user.access_token;
    
    getPage(url);
    
    $scope.importPhotos = function() {
        //$('#photos').isotope({filter: '.photoSelected'});
        //$timeout(function(){
            //$('#photos').fadeOut();
            //$('h2#buttons').fadeOut();
            var photos = $scope.photos;
            var selectedPhotos = [];
            for(var i in photos) {
                if(photos[i].selected)
                    selectedPhotos.push(photos[i]);
            }
            $http.post('/me/albums/' + $routeParams.myAlbumId + '/photos', selectedPhotos).success(function(data) {
                console.log(data);
            });
            $scope.$parent.photos = selectedPhotos;
            $timeout(function(){
                $scope.changeHash('/me/albums/' + $routeParams.myAlbumId + '/photos');
            }, 900);
        //}, 900);
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
    
    window.onorientationchange = function() {
        $('#photos').isotope('reLayout');
    }

}
PhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];

function MyPhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('MyPhotosCtrl');

    $scope.confirmAuth();
    
    $scope.photos = [];

    $http.get('/me/photos').success(function(data) {
        console.log(data);
        $scope.photos = data.photos;
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                $('#photos .span3').fadeIn(500);
                $c.isotope({
                    itemSelector: '.span3',
                    //masonry: {
                    //    columnWidth: 65
                    //}
                });
                
                //$('#photos .span3').resizable({
                //    //grid: 130,
                //    aspectRatio: true,
                //    start: function(event, ui) {
                //        $(this).css('z-index', 999);
                //    },
                //    stop: function(event, ui) {
                //        $(this).css('z-index', 2);
                //        $c.isotope('reLayout');
                //    }
                //});
                
                //$('#photos .span3').rotatable();
                //$('#photos .span3').each(function(){
                //    $(this).zoomTarget({
                //        closeclick: true
                //    });
                //});
                $('.boxer').boxer();
            });
        }, 500);
    
    });
    
    window.onorientationchange = function() {
        $('#photos').isotope('reLayout');
    }

}
MyPhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];

function MyAlbumsCtrl($scope, $http, $timeout) {

    console.log('MyAlbumsCtrl');

    $scope.confirmAuth();
    
    $scope.albums = [];
    
    var page = 0;

    function init() {
        $timeout(function() {
            if($scope.albums.length===0) {
                $('#newAlbumButton').fadeIn();
            }
            var $c = $('#albums');
            $c.imagesLoaded(function() {
                $('.loading').fadeOut(100);
                $('#albums .span3').fadeIn(500);
                $c.isotope({
                    itemSelector: '.span3',
                    //masonry: {
                    //    columnWidth: 65
                    //}
                });
            });
        });
    }
    
    function getPage(pageUrl) {
        $http.get(pageUrl).success(function(data) {
            console.log(data);
            page += 1;
            $scope.albums.push.apply($scope.albums, data.data);
            $scope.nextPage = data.paging.next;
            if(page===1) {
                init();
            } else {
                $timeout(function(){
                    $('#albums').imagesLoaded(function(){
                        $("#albums .span3:not('.isotope-item')").show();
                        $('#albums').isotope('appended', $("#albums .span3:not('.isotope-item')"));
                    });
                });
            }
        });
    }
    
    $scope.getNextPage = function() {
        getPage($scope.nextPage);
    };

    var url = "/me/albums";

    getPage(url);
    
    window.onorientationchange = function() {
        $('#albums').isotope('reLayout');
    }

}
MyAlbumsCtrl.$inject = ['$scope', '$http', '$timeout'];

function MyAlbumPhotosCtrl($scope, $http, $timeout, $routeParams) {

    console.log('MyAlbumPhotosCtrl');

    $scope.confirmAuth();
    
    $scope.photos = [];
    
    var page = 0;

    function init() {
        $timeout(function() {
            var $c = $('#photos');
            $c.imagesLoaded(function() {
                if($scope.photos.length===0) {
                    $('#newPhotoButton').fadeIn();
                }
                $('.loading').fadeOut(100);
                $('#photos .span3').fadeIn(500);
                $c.isotope({
                    itemSelector: '.span3',
                    //masonry: {
                    //    columnWidth: 65
                    //}
                });
                
                //$('#photos .span3').resizable({
                //    //grid: 130,
                //    aspectRatio: true,
                //    start: function(event, ui) {
                //        $(this).css('z-index', 999);
                //    },
                //    stop: function(event, ui) {
                //        $(this).css('z-index', 2);
                //        $c.isotope('reLayout');
                //    }
                //});
                
                $('.boxer').boxer();
            });
        });
    }
    
    function getPage(pageUrl) {
        $http.get(pageUrl).success(function(data) {
            console.log(data);
            page += 1;
            $scope.photos.push.apply($scope.photos, data.data);
            $scope.nextPage = data.paging.next;
            if(page===1) {
                init();
            } else {
                $timeout(function(){
                    $('#photos').imagesLoaded(function(){
                        $("#photos .span3:not('.isotope-item')").show();
                        $('#photos').isotope('appended', $("#photos .span3:not('.isotope-item')"));
                        $('#photos .span3').resizable({
                            //grid: 130,
                            aspectRatio: true,
                            start: function(event, ui) {
                                $(this).css('z-index', 999);
                            },
                            stop: function(event, ui) {
                                $(this).css('z-index', 2);
                                $('#photos').isotope('reLayout');
                            }
                        });
                        $('.boxer').boxer();
                    });
                });
            }
        });
    }
    
    $scope.getNextPage = function() {
        getPage($scope.nextPage);
    };

    var url = "/me/albums/" + $routeParams.albumId + "/photos";
    
    getPage(url);
    
    window.onorientationchange = function() {
        $('#photos').isotope('reLayout');
    }

}
MyAlbumPhotosCtrl.$inject = ['$scope', '$http', '$timeout', '$routeParams'];

function NewAlbumCtrl($scope, $http, $timeout) {

    console.log('NewAlbumCtrl');

    $scope.confirmAuth();
    
    $('#albumName').focus();
    
    $scope.createAlbum = function(name) {
        console.log('Creating album: ' + name);
        $http.post('/me/albums', { name: name }).success(function(data) {
            console.log(data);
            if(data.id !== null) {
                //$scope.changeHash('/me/albums/' + data.id + '/photos');
                $scope.changeHash('/me/albums/' + data.id + '/photos');
            }
        });
    };

}
NewAlbumCtrl.$inject = ['$scope', '$http', '$timeout'];
