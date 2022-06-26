
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { route } = require("express/lib/application");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const defaultBlogItems = [homeStartingContent, aboutContent, contactContent]

// Database connection

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://piotrk39:abSOMmSYhZ1fdkLS@cluster0.4nqqisj.mongodb.net/blogSiteDB');
}

const startingContentSchema = new mongoose.Schema({
  name: String
});

const blogPostSchema = new mongoose.Schema({
  title: String,
  content: String
});

const item = mongoose.model("item" ,startingContentSchema);

const blogPost = mongoose.model("blogPost", blogPostSchema);

app.get("/", function(req, res) {
  blogPost.find({}, function(err, docs){
    if(!err){
      res.render("home", {
        homeContent: homeStartingContent,
        newPost: docs,
        route: "/"
      })
    }
  })
});

// WORKING ON THIS ONE THE RECENT CHANGE IS MONGOOSE QUERY USE _ID TO RENDER THE CORRECT POST

// app.get("/posts/:postId", function(req, res){
  
//   const requestedPostId =  req.params.postId;

//   blogPost.findOne({_id: requestedPostId},function(err, blogPosts){
//     if(!err){
//       res.render("post", {
//         thisTitle: blogPosts.title,
//         thisContent: blogPosts.content,
//         route: "/posts:postId"
//       })
//     } else {
//       res.redirect("/");
//     }
//   })
// });

app.get("/posts/:postId", function(req, res){

  const requestedPostId = req.params.postId;
  
  blogPost.findOne({_id: requestedPostId}, function(err, blogPosts){
      res.render("post", {
        title: blogPosts.title,
        content: blogPosts.content,
        route: "/posts/" + requestedPostId
      });
      res.redirect("/posts/" + requestedPostId)
    });
  
  });

app.get("/about", function(req, res){
    res.render("about", {
      aboutPageContent: aboutContent,
      route: "/about"
  });
});

app.get("/contact", function(req, res){
    res.render("contact", {
      contactPageContent: contactContent,
      route: "/contact"
  });
});

app.get("/compose", function(req, res) {
  res.render("compose", {
    route: "/compose"
  });
})

app.post("/compose", function(req, res) {
  const newblogPost = new blogPost ({
    title: req.body.Title,
    content: req.body.Content
  });

  newblogPost.save();
  
  res.redirect("/");
  
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("Server started on port successfully!");
});
