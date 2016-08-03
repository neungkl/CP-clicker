var db = require('./db.js');

var control = {
  state: 'wait',
  isPlay: 'false',
  pingTime: '10'
};

var count = 0;

db.control.remove({}, function(err) {

  if(err) return console.error(err);

  for(var key in control) {
    console.log(key + " : " + control[key]);
    var obj = new db.control({
      key: key,
      value: control[key]
    });

    obj.save(function(err) {
      if(err) return console.error(err);

      console.log('Complete');
      if(++count == 3) process.exit();
    });
  }

});
