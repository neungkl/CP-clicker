var express = require('express');
var db = require('./db.js');
var bodyParser = require('body-parser');
var app = express();
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);

var isProduction = false;

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
    sid: req.sessionID,
    reject: false
  });

  user.save(function(err) {
    if(err) {
      res.send('false');
      res.end();
      return ;
    }

    req.session.inGame = true;
    res.send('true');
    res.end();
  });
});

app.get('/logout', function(req, res) {
  req.session.inGame = false;
  req.session.inGame = null;
  res.end();
});


app.get('/ping', function(req, res) {

  var send = {
    'status' : 'incomplete'
  };

  db.control.find({}, function(err, data) {
    if(err || typeof data === 'undefined' || data == null) {
      res.send(JSON.stringify(send));
      res.end();
    }

    send.status = 'complete';
    for(var i=0; i<data.length; i++) {
      send[data[i].key] = data[i].value;
    }

    res.send(JSON.stringify(send));
    res.end();
  });
})

app.get('/click', function(req, res) {
  db.control.findOne({ key : 'isPlay'}, function(err, data) {
    if(err || typeof data === 'undefined' || data == null) { res.send('No'); res.end(); }

    if(data.value === 'true') {
      var ins = new db.click({
        user: req.sessionID
      });

      ins.save(function(err) {
        if(err) { res.send('No'); res.end(); }
        else {
          res.send('Yes');
          res.end();
        }
      });
    } else {
      res.send('No');
      res.end();
    }
  });
});

app.get('/isReject', function(req, res) {
  db.user.findOne({ sid: req.sessionID }, function(err, data) {
    if(err || typeof data === 'undefined' || data == null) {
      res.send('No'); res.end();
      return ;
    }
    res.send(data.reject ? 'Yes' : 'No'); res.end();
  });
});

app.get('/admin', function(req, res) {
  if(req.query.pass === (process.env.ADMIN_PASSWORD || '1234')) {
    req.session.admin = true;
    res.writeHead(302, {'Location': './admin'});
    res.end();
  } else if(typeof req.session.admin === 'undefined' || req.session.admin == null || req.session.admin === false) {
    res.writeHead(302, {'Location': './index'});
    res.end();
  } else {
    res.render('admin', { production: isProduction });
  }
});

app.all('/admin/*', function(req, res, next) {
  if(typeof req.session.admin === 'undefined' || req.session.admin == null || req.session.admin === false) {
    res.writeHead(302, {'Location': '../index'});
    res.end();
  } else {
    next();
  }
});

app.get('/admin/data', function(req, res) {
  db.user.find({}, function(err, userData) {
    if(err) { res.send('[]'); res.end(); }

    db.click.find({}, function(err2, clickData) {
      if(err2) { res.send('[]'); res.end(); }

      if(typeof userData === 'undefined' || userData == null ||
         typeof clickData === 'undefined' || clickData == null) {
        res.send('[]'); res.end();
      }

      var ret = [];

      for(var i=0; i<userData.length; i++) {
        ret[i] = {
          user: userData[i].user,
          studentID: userData[i].studentID,
          sid: userData[i].sid,
          reject: userData[i].reject,
          count: -1
        };
      }

      for(var i=0; i<userData.length; i++) {
        for(var j=0; j<clickData.length; j++) {
          if(userData[i].sid == clickData[j].user) ret[i].count++;
        }
      }

      res.send(JSON.stringify(ret));
      res.end();
    });
  });
});

app.post('/admin/updateReject', function(req, res) {
  db.user.findOne({ sid: req.body.sid }, function (err, doc) {
    if(err || typeof doc === 'undefined' || doc == null) {
      res.send('Error'); res.end();
    }

    doc.reject = req.body.reject;
    doc.save(function(err) {
      if(err) { res.send('Error'); res.end(); }

      res.send('{"success": true}'); res.end();
    });
  });
});

app.post('/admin/updateControl', function(req, res) {
  db.control.findOne({ key: req.body.type }, function (err, doc) {
    if(err || typeof doc === 'undefined' || doc == null) {
      res.send('Error'); res.end();
    }

    doc.value = req.body.val;
    doc.save(function(err) {
      if(err) { res.send('Error'); res.end(); }

      res.send('{"success": true}'); res.end();
    });
  });
});

app.post('/admin/clean', function(req, res) {
  db.click.remove({}, function(err) {
    if(err) { res.send('Error'); res.end(); }
    else {
      res.send('{"success": true}'); res.end();
    }
  })
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
