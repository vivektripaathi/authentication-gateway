require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
var session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false}
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true}); 

const userschema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});
userschema.plugin(passportLocalMongoose);
userschema.plugin(findOrCreate);

const User = mongoose.model("User", userschema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"

    },
    (accessToken, refreshToken, profile, cb) => {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
));

app.get("/", (req, res)=>{
    res.render("home");
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.post("/register", (req, res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, () =>{
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/login", (req, res)=>{
    res.render("login", {wrong:""});
});
app.post("/login", (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
});
    req.login(user, (err) => {
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", (req, res)=>{
    req.logout((err) => {
        if(err){
            console.log(err);
        }
        res.redirect("/");
    });
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log("PORT : 3000")
});