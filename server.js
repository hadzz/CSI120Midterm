var express = require('express');
var app = express();
var weathers = require('weathers');
var weather = require('weather.js/weather.js');
//var connect = require('connect');
var fs = require('fs');
var Twit = require('twit');
var ce = require('cloneextend');
var analyze = require('Sentimental').analyze,
	positivity = require('Sentimental').positivity,
	negativity = require('Sentimental').negativty;
	
var twitReply;
var tweetsGeo = [];
var tweetsNoGeo = [];

app.use(express.static(__dirname));
app.use(express.bodyParser());

var T = new Twit({
    consumer_key:         'ebcNAoorQadvlkyoBFTeA'
  , consumer_secret:      'Tj95OUHsFYlSym2tkDJeHyqjmhxPWaPF0CzAaR0qJY'
  , access_token:         '890087444-Y3dB1iYHBxQ3sTdMlfbjX8KScYUKG3gb207N5n7g'
  , access_token_secret:  'WWRv1EZPgZSKKW5ZWM1XZltJbGJ8HHVUZeUznABYf9HVx'
});


app.configure(function(){
  		app.set('view engine', 'html');
  		app.engine('html', require('jqtpl/lib/express').render);
	});

app.post('/submit', function(req, res) {
	tweetsGeo = [];
	tweetsNoGeo = [];
	
	// read the user's input and store it
	var htag1 = req.body.hashtag1;
	var htag2 = req.body.hashtag2;
	var dateStart = req.body.dateStart;
	var dateEnd = req.body.dateEnd;
	
	
	var radius = req.body.mileRadius;
	

	var header = "";
	
	if (dateEnd == "" || dateStart == "")
	{
		header += "<p style=\"color:red\">Please enter a date in the field below.</p>"
	}
	if (htag1 == "" && htag2 == "")
	{
		header += "<p style=\"color:red\">Please enter a hash tag in the field below.</p>"
	}
	
	if (header != "")
	{
		res.render(__dirname + '/index.html', {test1: 'Results'}, function(err, html)
		{ 
			
			res.send(header + html);
		});
	}
	
	
	
	var longitude = req.body.geoLocationLong;
	var latitude = req.body.geoLocationLat;
	
	console.log('Button Event Being Processed...');
	
	console.log('Htag1: ' + htag1);
	console.log('Htag2: ' + htag2);
	console.log('Date Start: ' + dateStart);
	console.log('Date End: ' + dateEnd);
	console.log('Radius: ' + radius);
	console.log('Longitude: ' + longitude);
	console.log('Latitude: ' + latitude);
	
	weathers.getWeather(latitude, longitude, function(err, data){
		if (data)
		{
			var temp = JSON.stringify(data.currentobservation.Temp, null, 4).replace(/["']/g, "");
			var location = JSON.stringify(data.location.areaDescription, null, 4).replace(/["']/g, "");
			console.log("Current Location: " + location);
			console.log("Current Temperature: " + temp);
		}
    });
	
	var numOfTweets = 9999;
	
	var output;
	
	if ((htag1 != "#" && htag1 != "") && (htag2 != "#" && htag2 != ""))
	{
		htag1 = "#" + htag1;
		htag2 = "#" + htag2;
		T.get('search/tweets', {q: [htag1 + " since:" + dateStart + " until:" + dateEnd, htag2 + " since:" + dateStart + " until:" + dateEnd],
		count: numOfTweets, lang: 'en', geocode: latitude + "," + longitude + "," + radius + "mi"}, 
			function(err, reply) {
				if (typeof(reply.statuses[0]) != 'undefined')
				{
					res.render(__dirname + '/page2_1.html', function(err, html1)
					{
						res.render(__dirname + '/page2_2.html', function(err, html2)
						{
							twitReply = ce.clone(reply);
							sortTweetsBySentiment(twitReply);
							var hostName = req.get('host');
							var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
							output = createTableBody();
							html2 = html2.replace("%HOSTNAME%", hostName);
							res.send(header + html1 + output + html2);
						})
					})
				}
				else
				{
					res.send("Error, could not find tweets using your search query.");
				}
		});
	}
	else if (htag1 != "#" && htag1 != "")
	{
		htag1 = "#" + htag1;
		T.get('search/tweets', {q: htag1, count: numOfTweets, language: 'en', since: dateStart, until: dateEnd}, 
		function(err, reply) {
			if (typeof(reply.statuses[0]) != 'undefined')
			{
				res.render(__dirname + '/page2_1.html', {test1: 'Results'}, function(err, html1)
				{ 
					res.render(__dirname + '/page2_2.html', {test1: 'Results'}, function(err, html2)
					{ 
						twitReply = clone(reply);
						sortTweetsBySentiment(twitReply);
						var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
						output = createTableBody();
						html2 = html2.replace("%HOSTNAME%", hostName);
						res.send(header + html1 + output + html2);
					})
				});
			}
			else
			{
				res.send("Error, could not find tweets using your search query.");
			}
		});
	}
	else if (htag2 != "#" && htag2 != "")
	{
		T.get('search/tweets', {q: htag2, count: numOfTweets, language: 'en', since: dateStart, until: dateEnd}, 
		function(err, reply) {
			if (typeof(reply.statuses[0]) != 'undefined')
			{
				res.render(__dirname + '/page2_1.html', {test1: 'Results'}, function(err, html1)
				{ 
					res.render(__dirname + '/page2_2.html', {test1: 'Results'}, function(err, html2)
					{ 
							twitReply = clone(reply);
							sortTweetsBySentiment(twitReply);
							var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
							output = createTableBody();
							html2 = html2.replace("%HOSTNAME%", hostName);
							res.send(header + html1 + output + html2);
					})
				});
			}
			else
			{
				res.send("Error, could not find tweets using your search query.");
			}
		});
	}
	
	
});

function sortTweetsBySentiment()
{
	twitReply.statuses.sort( function(a, b) {
		return parseInt(analyze(b.text).score) - parseInt(analyze(a.text).score);
	});
}

function lookForEmpty()
{
	for (var i=0; i<twitReply.statuses.length; i++) {
		if (!twitReply.statuses[i].place)
		{
			return true;
		}
	}
	return false;	
}

function createTableBody()
{

	var output = "";
	
	
	

	for (var i=0; i<twitReply.statuses.length; i++) {
		if (!twitReply.statuses[i].place)
		{
			tweetsNoGeo.push(twitReply.statuses[i]);
		}
		else
		{
			tweetsGeo.push(twitReply.statuses[i]);
		}
	}
	
	for (var i=0; i<tweetsGeo.length; i++) {
		if (i == 0)
		{
		//console.log(tweetsGeo[i]);
		}
		var score = analyze(tweetsGeo[i].text).score;
		var location = tweetsGeo[i].place.full_name;
		var condition = "N/A";
		
		weather.getCurrent("Kansas City", function(forecast) {
			//expect(forecast.day).to.be.a(weather.Forecast);
			if (forecast)
			{
				console.log(forecast.conditions());	
				condition = forecast.conditions();
			}
		});
		
		output += "<tr class=\"data\">" +
		"<td style='text-align: center'>" + '<img src="' + tweetsNoGeo[i].user.profile_image_url + '"/>' +
		"</td>" +
		"<td style='text-align: center'>@" + tweetsNoGeo[i].user.screen_name +
		"</td>" +
		"<td>" + tweetsGeo[i].created_at + "</td>" +
		"<td>" + JSON.stringify(tweetsGeo[i].text, null, 4).replace(/["']/g, "") + "</td>" +
		"<td style='text-align: center'>" + score + "</td>" +
		"<td style='text-align: center'>" + location + "</td>" +
		"<td style='text-align: center'>" + condition+ "</td>" +
		"</tr>\n";
	}
	
	for (var i=0; i<tweetsNoGeo.length; i++)
	{
		var score = analyze(tweetsNoGeo[i].text).score;
		output += "<tr class=\"data\">" +
			"<td style='text-align: center'>" + '<img src="' + tweetsNoGeo[i].user.profile_image_url + '"/>' +
			"</td>" +
			"<td style='text-align: center'>@" + tweetsNoGeo[i].user.screen_name +
			"</td>" +
			"<td>" + tweetsNoGeo[i].created_at + "</td>" +
			"<td>" + JSON.stringify(tweetsNoGeo[i].text, null, 4).replace(/["']/g, "") + "</td>" +
			"<td style='text-align: center'>" + score + "</td>" +
			"<td style='text-align: center'>" + "N/A" + "</td>" +
			"</tr>\n";
	}
	
	return output;
}

function logData(data)
{
	fs.writeFile("log.txt", data, function(err) {
		if(err) {
			console.log(err);
		} else {
			console.log("The file was saved!");
		}
	}); 
}


function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

var port = process.env.PORT || 5000;
app.listen(port);