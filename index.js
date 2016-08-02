var express = require('express');
var db = require('./db.js');
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var isProduction = true;

app.set('port', (process.env.PORT || 8000));

app.use(session({
  store: new mongoStore({
    mongooseConnection: db.connection,
    ttl: 3 * 24 * 60 * 60
  }),
  resave: true,
  saveUninitialized: false,
  secret : 'ilikebanana'
}));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.get(['/','/index'], function(req, res) {
  if(typeof req.session.inGame === 'undefined' || req.session.inGame == null) {
    res.render('index', { production: isProduction });
  } else {
    res.writeHead(302, {'Location': './clicker'});
    res.end();
  }
});

app.get('/clicker', function(req,res) {
  if(typeof req.session.inGame === 'undefined' || req.session.inGame == null) {
    res.writeHead(302, {'Location': './index'});
    res.end();
  } else {
    res.render('clicker', { production: isProduction });
  }
});

app.post('/login', function(req, res) {

  function isEmpty(txt) {
    if(typeof txt === 'undefined' || txt == null) return true;
    if(typeof txt !== 'string') return true;
    if(txt.trim().length == 0) return true;
    return false;
  }

  if(isEmpty(req.body.name) || isEmpty(req.body.studentID)) {
    res.send('false');
    res.end();
    return ;
  }

  var user = new db.user({
    user: req.body.name,
    studentID: req.body.studentID,
    sid: req.sessionID
  })
  req.session.inGame = true;

  res.send('true');
  res.end();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
