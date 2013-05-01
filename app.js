var express = require('express'),
    port = process.env.PORT || 3000,
    app = express(),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express),
    logentries = require('node-logentries'),
    log = logentries.logger({
        token:process.env.LOGENTRIES_TOKEN
    }),
    env,
    mongourl,
    callbackURL = 'http://photo.kristsauders.c9.io/auth/facebook/callback',
    sessionStore;
    
if(process.env.VCAP_SERVICES!==undefined) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    console.log(env);
    log.info(JSON.stringify(env));
    mongourl = env['mongodb-1.8'][0].credentials;
    callbackURL = 'http://photo.hp.af.cm/auth/facebook/callback';
    sessionStore = new MongoStore({
        db: 'photo',
        auto_reconnect: true
    });
}

passport.use(new FacebookStrategy({
    clientID: '241385652670782',
    clientSecret: '348a68ede0be7bf1102e492c58534a02',
    callbackURL: callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // Add access token to profile, to make it available to views
    profile.access_token = accessToken;
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
        secret: 'keyboard cat',
        store: sessionStore
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

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['user_photos', 'publish_actions'] })
);

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));

app.get('/', function(req, res) {
    //Kitten.find({ name: "fluffy" }, function(err,kittens){
    //    console.log(kittens);
    //    log.log("debug", kittens);
    //});
    if(req.user!==undefined) {
        console.log('Pageload by user: ' + req.user.displayName);
        log.info("Pageload by user: " + req.user.displayName);
        req.user.authenticated = true;
        res.render('index', { user: req.user });
    } else {
        res.render('index', { user: { authenticated: false } } );
    }
});

app.get('/auth/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

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

photosSchema.methods.speak = function () {
  console.log('I belong to ' + this.user_id);
};

var Photos = mongoose.model('Photos', photosSchema);

//var fluffy = new Kitten({ name: 'fluffy' });
//fluffy.speak();// "Meow name is fluffy"

//fluffy.save(function (err, fluffy) {
//  if (err){} // TODO handle the error
  //fluffy.speak();
//});

app.post('/me/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        console.log(req.body);
        var photos = new Photos({ user_id: req.user.id, photos: req.body });
        console.log(photos);
        photos.save(function(err, photos) {
            if(err) {
                console.log(err);
            }
            console.log(photos);
            res.send(req.body);
        });
    }
});

app.get('/me/photos', function(req, res) {
    if(req.user===undefined)
        res.send(401, 'You are not logged in.');
    else {
        Photos.find({user_id: req.user.id}, function(err,photos) {
            if(err) {
                console.log(err);
            }
            console.log(photos);
            res.send(photos[photos.length-1]);
        });
    }
});

log.log("debug", {sleep:"all night", work:"all day"});

// Initialize server
app.listen(port);
console.log('Listening on port ' + port);
