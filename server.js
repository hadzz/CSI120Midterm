var express = require('express');
var weather = require('weather')
var app = express();


app.get('/', function(req, res){
  res.send('hello world');
  weather({location: 'Burlington, VT'}, function(data) {
  if (data.temp > 30) {
    console.log("Damn it's hot!");
  }
});
});



var port = process.env.PORT || 5000;
app.listen(port);