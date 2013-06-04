var express = require('express'),
    port = process.env.PORT || 3000,
    app = express(),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express),
    logentries = require('node-logentries'),
    logentries = logentries.logger({
        token:process.env.LOGENTRIES_TOKEN
    }),
    env,
    mongourl,
    callbackURL = 'http://photo.kristsauders.c9.io/auth/facebook/callback',
    sessionStore;
    
// Function to log to console and Logentries
var log = function(message) {
    console.log(message);
    logentries.info(message);
}
    
// If running on Cloud Foundry, set callback and mongodb connection
if(process.env.VCAP_SERVICES!==undefined) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    log(env);
    mongourl = env['mongodb-1.8'][0].credentials;
    callbackURL = 'http://photo-app.eu01.aws.af.cm/auth/facebook/callback';
    sessionStore = new MongoStore({
        db: 'photo',
        auto_reconnect: true
    });
}

// Settings for Facebook authentication
passport.use(new FacebookStrategy({
    clientID: '241385652670782',
    clientSecret: '348a68ede0be7bf1102e492c58534a02',
    callbackURL: callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // Add access token to profile, to make it available to views
    profile.access_token = accessToken;
    log(profile);
    return done(null, profile);
  }
));

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.static('public'));
  app.use(express.favicon());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ 
        secret: 'This is a huge secret...',
        store: sessionStore,
        cookie: { maxAge: 2592000000 }
    }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

// Serialize to save to db
passport.serializeUser(function(user, done) {
  done(null, user);
});
// Deserialize to find in db by id
passport.deserializeUser(function(id, done) {
  done(null, id);
});

// This route redirects to Facebook for login
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['user_photos', 'publish_actions'] })
);

// This is the callback from Facebook, and will redirect to the main app page
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

// The main single page app
app.get('/', function(req, res) {
    //Kitten.find({ name: "fluffy" }, function(err,kittens){
    //    console.log(kittens);
    //    log.log("debug", kittens);
    //});
    if(req.user!==undefined) {
        log('Pageload by user: ' + req.user.displayName);
        req.user.authenticated = true;
        res.render('index', { user: req.user });
    } else {
        log('Pageload by unauthenticated user');
        res.render('index', { user: { authenticated: false } } );
    }
});

// Logout from the app, and redirect to main page
app.get('/auth/logout', function(req, res) {
    if(req.user!==undefined){
        log('Logout by user: ' + req.user.displayName);
    }
    req.logout();
    res.redirect('/');
});

// AppFog automatically replaces this url
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

// Log mongodb connection errors
db.on('error', function(err){
    log('Error connecting to mongodb: ' + err);
});

// Experimental schema for storing photo album
var photosSchema = mongoose.Schema({
    user_id: String,
    photos: [
            {
                id: String,
                selected: Boolean,
                images: [
                        {
                            height: Number,
                            width: Number,
                            source: String
                        }
                    ]
            }
        ]
});

var photoSchema = mongoose.Schema({
    user_id: String,
    albumId: Number,
    id: Number,
    images: [{
        height: Number,
        width: Number,
        source: String
    }]
});

// Experimental schema for storing photo album
var albumSchema = mongoose.Schema({
    user_id: String,
    id: String,
    name: String
});

var Album = mongoose.model('Album', albumSchema);
var Photo = mongoose.model('Photo', photoSchema);

// Save a new album, still early stage
app.post('/me/albums', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        // Generate random id for album
        var id = Math.floor(Math.random() * 9000000000000) + 10000;
        var album = new Album({ user_id: req.user.id, name: req.body.name, id: id });
        log(album);
        album.save(function(err, album) {
            if(err) {
                log(err);
            }
            log('Successfully saved album to mongodb');
            res.send(album);
        });
    }
});

// Returns JSON with user's albums
app.get('/me/albums', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        Album.find({user_id: req.user.id}, function(err,albums) {
            if(err) {
                log(err);
            }
            log(albums);
            res.send({ data: albums, paging: {} });
        });
    }
});

// Just showing how to add a method to a mongoose schema
photosSchema.methods.speak = function () {
  log('I belong to ' + this.user_id);
};

var Photos = mongoose.model('Photos', photosSchema);

//var fluffy = new Kitten({ name: 'fluffy' });
//fluffy.speak();// "Meow name is fluffy"

//fluffy.save(function (err, fluffy) {
//  if (err){} // TODO handle the error
  //fluffy.speak();
//});

app.post('/me/albums/:albumId/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        console.log(req.body);
        for(var i in req.body) {
            console.log(i);
            console.log(req.body[i]);
            var photo = new Photo({ 
                user_id: req.user.id, 
                albumId: req.params.albumId,
                id: req.body[i].id,
                images: req.body[i].images
            });
            log(photo);
            photo.save(function(err) {
                if(err) {
                    log(err);
                }
            });
        }
        res.send(req.body);
    }
});

app.get('/me/albums/:albumId/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        Photo.find({user_id: req.user.id, albumId: req.params.albumId}, function(err, photos) {
            if(err) {
                log(err);
            }
            log(photos);
            res.send({ data: photos, paging: {} });
        })
        //res.send(req.body);
    }
});

// Save a new photo album, still early stage
app.post('/me/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        var photos = new Photos({ user_id: req.user.id, photos: req.body });
        log(photos);
        photos.save(function(err, photos) {
            if(err) {
                log(err);
            }
            log('Successfully saved photos to mongodb');
            res.send(req.body);
        });
    }
});

// Returns JSON with most recent photo album the user saved
app.get('/me/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        Photos.find({user_id: req.user.id}, function(err,photos) {
            if(err) {
                log(err);
            }
            log(photos);
            res.send(photos[photos.length-1]);
        });
    }
});

// Initialize server
app.listen(port);
log('Restarted app. Listening on port ' + port);
