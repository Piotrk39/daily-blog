// Step 1 - set up express & mongoose

const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate');

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Google Oauth startegy constant

const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport and express-session

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const LocalStrategy = require("passport-local");

// Step 2 - connect to the database

mongoose.connect(process.env.MONGO_URL_LIVE,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
      console.log('connected')
    });
// Step 3 - this is the code for ./models.js

const imageSchema = new mongoose.Schema({
  title: String,
  content: String,
  img:
    {
        data: Buffer,
        contentType: String
    }
});

// User Schema to store the user and his hashed password

const userSchema = mongoose.Schema({
  username: {
    type: String,
  },
  googleId: {
    type: String,
  },
  password: {
    type: String,
  },
  authorName: {
    type: Object,
  },
});

// passport-mongoose initialize

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Image is a model which has a schema imageSchema

const imageModel = mongoose.model('Image', imageSchema);
const user = mongoose.model('user', userSchema);

// Step 3 - code was added to ./models.js

// Step 4 - set up EJS

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// passport global strategy
passport.use(user.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
    // console.log(user.id);
});
  
passport.deserializeUser(function(id, done) {
    user.findById(id, function (err, user) {
        done(err, user);
        // console.log(user.id);
    });
});

// GOOGLE Oauth strategy

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'https://mysterious-brushlands-82597.herokuapp.com/auth/google/secrets'
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile.id);
    user.findOrCreate(
      { 
        googleId: profile.id,
        username: profile.emails[0].value
      },
      function (err, user) {
        return cb(err, user);
      });
  }
));

// Set up the Session

app.use(session({
  secret: env.process.SECRET_MESSAGE,
  resave: false,
  saveUninitialized: false
}));

// Set up passport

app.use(passport.initialize());
app.use(passport.session());

// Set EJS as templating engine
app.set("view engine", "ejs");

// Step 5 - set up multer for storing uploaded files

const multer = require('multer');
const { profile } = require('console');
const { env } = require('process');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});

const upload = multer({ storage: storage });
// Step 6 - load the mongoose model for Image

// Step 7 - the GET request handler that provides the HTML UI

app.get('/', (req, res) => {
  if(req.isAuthenticated()) {
    imageModel.find({}, (err, items) => {
      if (err) {
        console.log(err);
        res.status(500).send('An error occurred', err);
      }
      else {
        res.render('home', { items: items });
      }
    });
  } else {
    res.redirect('/login')
  }
});

// GOOGLE OUATH route

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile", "email"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect('/');
  });  

// Step 8 - the POST handler for processing the uploaded file

app.get("/compose", function(req, res) {
  // console.log(req.user.googleId)
  if(req.isAuthenticated() && req.user.googleId === process.env.USER_GOOGLE_ID) {
      res.render("compose", {
        route: "/compose"
      });
    } else {
      res.redirect('/');
    }  
});

app.post('/compose', upload.single('image'), (req, res, next) => {

    const obj = {
      title: req.body.Title,
      content: req.body.Content,
      img: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/png'
      }
    }
    imageModel.create(obj, (err, item) => {
      if (err) {
        console.log(err);
      }
      else {
        // item.save();
        res.redirect('/');
      }
    });
  });

  // GET the blogpost

app.get("/posts/:postId", function(req, res){

    const requestedPostId = req.params.postId;
    
    imageModel.findOne({_id: requestedPostId}, function(err, blogPosts){
      
      if(!err){
          res.render("post", {
            img: blogPosts.img,
            title: blogPosts.title,
            content: blogPosts.content,
            route: "/posts/"+requestedPostId
          });
        }
      });   
    });

// GET About page route

app.get("/about", function(req, res){
    res.render("about", {
      route: "/about"
  });
});

// GET Login page route

app.get("/login", function(req, res){
    res.render("login", {
      route: "/login"
  });
});

// LOGOUT

app.get('/logout', function(req, res){
  req.logout(function(err){
      if(err){
          console.log(err);
      }else{
          res.redirect('/');
      }
  });
});

// Require static images in blogposts

app.use('/public/images/', express.static('./public/images'));

// Step 9 - configure the server's port

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("Server started on port successfully!");
});