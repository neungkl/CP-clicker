var mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI || "monogodb://localhost/clicker");

var returnFunc;
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error : '));
db.once('open', function() {

  var controlSchema = mongoose.Schema({
    key: String,
    value: String
  });

  var userSchema = mongoose.Schema({
    user: String,
    studentID: String,
    sid: String
  });

  var clickSchema = mongoose.Schema({
    user: String,
    timestamp: { type: Date, default: Date.now }
  });

  if(typeof returnFunc === 'function') {
    returnFunc({
      Control: mongoose.model('Control', controlSchema),
      User: mongoose.model('User', userSchema),
      Click: mongoose.model('Click', clickSchema)
    });
  }
});

module.exports = function(func) {
  returnFunc = func;
}
