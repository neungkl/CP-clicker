var db = require('./db.js');

var control = {
  state: 'wait',
  isPlay: 'false',
  pingTime: 30
};

db.control.remove({}, function(err) {

  if(err) return console.error(err);

  for(var key in control) {
    var obj = new db.control({
      key: key,
      value: control[key]
    });

    obj.save(function(err) {
      if(err) return console.error(err);

      console.log('Complete');
      process.exit();
    });
  }

});
