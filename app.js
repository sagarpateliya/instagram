var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var api = require('instagram-node').instagram();


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'secret',
  saveUninitialized: true,
  resave: true
}));


//Global vars
app.use(function(req, res, next){
  //format date
  res.locals.formatDate = function(data){
    var myDate = new Date(date*1000);
    return myDate.toLocaleString();
  }

  //Is user loggedIn?
  if(req.session.accesstoken && req.session.accesstoken != 'undefined'){
    res.locals.isLoggedIn = true;
  } else{
    res.locals.isLoggedIn = false;
  }
  next();
})

//instagram stuff
api.use({
  client_id:'',               //your instagram client id and clien secret 
  client_secret:''
});

var redirect_uri = 'http://localhost:3000/handleauth';

exports.authorize_user = function(req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Access token' + result.access_token);
      console.log('User Id' + result.user.id);
      res.send('You made it!!');

    }
  });
};

//Index route
app.get('/', function(req, res, next){
    res.render('index', {
      title: 'Welcome'
    });
});

//Main route
app.get('/main', function(req, res, next){
  api.user(req.session.uid, function(err, result, ramaining, limit){
        if(err){
        res.send(err);
      }
      api.user_media_recent(req.session.uid, {}, function(err, medias, pagination, remaining, limit){
      if(err){
        res.send(err);
      }
      res.render('main', {
        title: 'myInsta',
        user: result,
        medias: medias
      });
      });
  });
});

//Logout
app.get('/logout', function(req,res, next){
  req.session.accesstoken = false;
  req.session.uid = false;
  res.redirect('/');
});

//login User
app.get('/login', exports.authorize_user);

//handle authorize_user
app.get('/handleauth', exports.handleauth);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
