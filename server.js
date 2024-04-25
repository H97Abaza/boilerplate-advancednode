"use strict";
const routes = require("./routes.js");
const auth = require("./auth.js");
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const passportSocketIo=require("passport.socketio")
const MongoStore=require("connect-mongo")(session)
const cookieParser=require("cookie-parser")

const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

app.set("view engine", "pug");
app.set("views", "./views/pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    name:'express.sid',
    store
  })
);
app.use(passport.initialize());
app.use(passport.session());
fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  routes(app, myDataBase);
  auth(app, myDataBase);


function onAuthorizeSuccess(data, accept) {
  console.log("successful connection to socket.io");

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
}
  io.use(
    passportSocketIo.authorize({
      store,
      cookieParser,
      key:"express.sid",
      secret:process.env.SESSION_SECRET,
      success:onAuthorizeSuccess,
      fail:onAuthorizeFail
    })
  )
  let currentUsers = 0;
  io.on("connection", (socket) => {
    console.log("A user has connected");
    ++currentUsers;
    const username = socket.request.user.username;
    io.emit("user", { currentUsers, username ,connected:true});
    console.log("user " + username + " connected");
    socket.on("chat message",(message)=>{
      io.emit("chat message",{username,message})
      console.log(username+":"+message)
    })
    socket.on('disconnect',()=>{
      console.log('user has disconnected');
      --currentUsers;
      io.emit("user", { currentUsers, username ,connected:false});
    })
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
