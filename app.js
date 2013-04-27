var express = require('express'),
    port = process.env.PORT || 3000,
    app = express(),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    mongoose = require('mongoose'),
    logentries = require('node-logentries'),
    log = logentries.logger({
        token:process.env.LOGENTRIES_TOKEN
    }),
    env,
    mongourl;
    
if(process.env.VCAP_SERVICES!=undefined) {
    env = JSON.parse(process.env.VCAP_SERVICES);
    console.log(env);
    log.info(JSON.stringify(env));
    mongourl = env['mongodb-1.8'][0]['credentials'];
}

passport.use(new FacebookStrategy({
    clientID: '241385652670782',
    clientSecret: '348a68ede0be7bf1102e492c58534a02',
    //callbackURL: 'http://photo.hp.af.cm/auth/facebook/callback'
    callbackURL: 'http://photo.kristsauders.c9.io/auth/facebook/callback'
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
  app.use(express.session({ secret: 'keyboard cat' }));
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
    Kitten.find({ name: "fluffy" }, function(err,kittens){
        console.log(kittens);
        log.log("debug", kittens);
    });
    if(req.user!=undefined) {
        console.log('Pageload by user: ' + req.user.displayName);
        log.info("Pageload by user: " + req.user.displayName);
        res.render('index', { user: req.user });
    } else {
        res.render('index', { user: { authenticated: false } } );
    }
});

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

var kittySchema = mongoose.Schema({
    name: String
});

kittySchema.methods.speak = function () {
  var greeting = this.name
    ? "Meow name is " + this.name
    : "I don't have a name";
  console.log(greeting);
};

var Kitten = mongoose.model('Kitten', kittySchema);

var fluffy = new Kitten({ name: 'fluffy' });
//fluffy.speak();// "Meow name is fluffy"

fluffy.save(function (err, fluffy) {
  if (err){} // TODO handle the error
  //fluffy.speak();
});

log.log("debug", {sleep:"all night", work:"all day"});

// Initialize server
app.listen(port);
console.log('Listening on port ' + port);
