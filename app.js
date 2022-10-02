require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
var session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
/*const encrypt = require("mongoose-encryption");*/
/*const md5 = require('md5');*/
// Hashing: Take a password run it through the hash function we end up with a hash that we store on our database.
// Hashing: Password ---Hash Function---> Hash.
// const bcrypt = require('bcrypt');
//Salting: Take a password add some randomly generated characters (salt) run it through the hash function we end up with a hash that we store on our database.
//Salting: Password + Salt ---Hash Function---> Hash.   One Round of Salting
//             Hash + Salt ---Hash Function---> Hash.   Two Round of Salting
//                                                                  .......
//                                                                  .......
// const saltRounds = 10;

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
    password: String
});
/*//Encryption: Password + Key ---CipherMethod---> CipherText
userschema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});*/
userschema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userschema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
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