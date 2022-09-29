require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
/*const encrypt = require("mongoose-encryption");*/
/*const md5 = require('md5');*/
// Hashing: Take a password run it through the hash function we end up with a hash that we store on our database.
// Hashing: Password ---Hash Function---> Hash.
const bcrypt = require('bcrypt');
//Salting: Take a password add some randomly generated characters (salt) run it through the hash function we end up with a hash that we store on our database.
//Salting: Password + Salt ---Hash Function---> Hash.   One Round of Salting
//             Hash + Salt ---Hash Function---> Hash.   Two Round of Salting
//                                                                  .......
//                                                                  .......
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect(process.env.MONGODB, {useNewUrlParser: true}); 

const userschema = new mongoose.Schema({
    email: String,
    password: String
});
/*//Encryption: Password + Key ---CipherMethod---> CipherText
userschema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});*/

const User = mongoose.model("User", userschema);

app.get("/", (req, res)=>{
    res.render("home");
});
app.get("/login", (req, res)=>{
    res.render("login", {wrong:""});
});
app.get("/register", (req, res)=>{
    res.render("register");
});
app.get("/logout", (req, res)=>{
    res.render("home");
});

app.post("/register", (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) { //Salting
        const newUser = new User({
            email: req.body.username,
            password: hash 
        });
        // Store hash in your password DB.
        newUser.save((err)=>{
            if(err){
                console.log(err);
            }else{
                res.render("secrets");
            }
        });
    });
    /*const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) //Hashing
    });*/
    
});
app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}, (err, foundUser)=>{
        if(!err){
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(!err){
                        if(result === true){
                            res.render("secrets");
                        }else{
                            res.render("login", {wrong: "Paswword or username didn't match"});
                        }
                    }
                });
            }
        }
    });
});
app.listen(3000, ()=>{
    console.log("PORT : 3000")
});