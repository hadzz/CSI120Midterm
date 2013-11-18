var express = require('express');
var app = express();
var weather = require('weather');


app.get('/', function(req, res){
  weather();
  res.send('hello world');
});

weather({location: 'Melbourne'}, function(data) {
  if (data.temp > 30) {
    console.log("Damn it's hot!");
  }
});

var port = process.env.PORT || 5000;
app.listen(port);




