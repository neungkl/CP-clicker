var mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/clicker");

var controlSchema = mongoose.Schema({
  key: String,
  value: String
});

var userSchema = mongoose.Schema({
  user: String,
  studentID: String,
  sid: String,
  reject: Boolean
});

var clickSchema = mongoose.Schema({
  user: String
});

module.exports = {
  control: mongoose.model('Control', controlSchema),
  user: mongoose.model('User', userSchema),
  click: mongoose.model('Click', clickSchema),
  connection: mongoose.connection
}
