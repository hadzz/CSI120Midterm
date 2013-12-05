var express = require('express');
var app = express();
//var connect = require('connect');
var yrno = require('yr.no-forecast')
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
	

	var numOfTweets = 100;
	
	
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
							var hostName = req.get('host');
							var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
							createTableBody(sendHTML);
							function sendHTML(output) {
    					        html2 = html2.replace("%HOSTNAME%", hostName);
    							res.send(header + html1 + output + html2);
							}
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
		T.get('search/tweets', {q: htag1, count: numOfTweets, lang: 'en', since: dateStart, until: dateEnd}, 
		function(err, reply) {
			if (typeof(reply.statuses[0]) != 'undefined')
			{
				res.render(__dirname + '/page2_1.html', {test1: 'Results'}, function(err, html1)
				{ 
					res.render(__dirname + '/page2_2.html', {test1: 'Results'}, function(err, html2)
					{ 
						twitReply = ce.clone(reply);
						var hostName = req.get('host');
						var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
						createTableBody(sendHTML);
						function sendHTML(output) {
    					       html2 = html2.replace("%HOSTNAME%", hostName);
    						res.send(header + html1 + output + html2);
						}
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
		T.get('search/tweets', {q: htag2, count: numOfTweets, lang: 'en', since: dateStart, until: dateEnd}, 
		function(err, reply) {
			if (typeof(reply.statuses[0]) != 'undefined')
			{
				res.render(__dirname + '/page2_1.html', {test1: 'Results'}, function(err, html1)
				{ 
					res.render(__dirname + '/page2_2.html', {test1: 'Results'}, function(err, html2)
					{ 
							twitReply = ce.clone(reply);
							var header = "<p>Number of Results: " + twitReply.statuses.length + "</p>";
							var hostName = req.get('host');
    						createTableBody(sendHTML);
    						function sendHTML(output) {
        					       html2 = html2.replace("%HOSTNAME%", hostName);
        						res.send(header + html1 + output + html2);
    						}
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

function sortTweetsBySentiment(obj)
{
	obj.sort( function(a, b) {
		return parseInt(analyze(b.text).score) - parseInt(analyze(a.text).score);
	});
	return obj;
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

function createTableBody(callback)
{
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
	
	tweetsGeo = sortTweetsBySentiment(tweetsGeo);
	tweetsNoGeo = sortTweetsBySentiment(tweetsNoGeo);
	
	var output1 = '';
	var output2 = '';
	
	createGeoTable(output1, function(output1Res) {
            createNoGeoTable(output2, function(output2Res) {
                callback("<tr class='separator'><td colspan='7'>Geo Tweets</td></tr>" + output1Res + "<tr class='separator'><td colspan='7'>Non Geo Tweets</td></tr>" + output2Res);
            });
        }
	);
}

function createNoGeoTable (output, callback)
{
    for (var i=0; i<tweetsNoGeo.length; i++) {
        var city = "N/A";
		var arrLength = tweetsNoGeo.length;
		
        var tweet = tweetsNoGeo[i];
        var score = analyze(tweet.text).score;
        
        if (tweet.user.location) {
            city = tweetsNoGeo[i].user.location;
        }
        
        output += "<tr class=\"data\">" +
        "<td style='text-align: center'>" + '<img src="' + tweet.user.profile_image_url + '"/>' +
        "</td>" +
        "<td style='text-align: center'>@" + tweet.user.screen_name +
        "</td>" +
        "<td>" + tweet.created_at + "</td>" +
        "<td>" + JSON.stringify(tweet.text, null, 4).replace(/["']/g, "") + "</td>" +
        "<td style='text-align: center'>" + score + "</td>" +
        "<td style='text-align: center'>" + city + "</td>" +
        "<td style='text-align: center'>" + "N/A" + "</td>" +
        "</tr>\n";
    }
    callback(output);
}

function createGeoTable (output, callback)
{
    if (!tweetsGeo[0] || tweetsGeo.length === 0) {
        callback(output);
    }
    
    for (var i=0; i<tweetsGeo.length; i++) {
        var callbackCounter = 0;
		var arrLength = tweetsGeo.length;
        var longitude = tweetsGeo[i].coordinates.coordinates[0];
		var latitude = tweetsGeo[i].coordinates.coordinates[1];
		
    	yrno.getWeather({lat: latitude, lon: longitude}, function(err, location){
		    if (err) {
		        callbackCounter++;
		        console.log('Error returning weather object');
		        if (callbackCounter == arrLength)
                {
                    callback(output);
                }
		    }
		    else {
    		    console.log("loading " + (callbackCounter+1) + " of " + tweetsGeo.length);
    	        location.getCurrentSummary((function(tweetsNoGeo){
            	        return function(err2, data) {
            	            if (!err2)
            	            {
                                var tweet = tweetsNoGeo[callbackCounter];
                                var score = analyze(tweet.text).score;
                                var city = tweet.place.full_name;
                                output += "<tr class=\"data\">" +
                                "<td style='text-align: center'>" + '<img src="' + tweet.user.profile_image_url + '"/>' +
                                "</td>" +
                                "<td style='text-align: center'>@" + tweet.user.screen_name +
                                "</td>" +
                                "<td>" + tweet.created_at + "</td>" +
                                "<td>" + JSON.stringify(tweet.text, null, 4).replace(/["']/g, "") + "</td>" +
                                "<td style='text-align: center'>" + score + "</td>" +
                                "<td style='text-align: center'>" + city + "</td>" +
                                "<td style='text-align: center'>" + data.icon + "</td>" +
                                "</tr>\n";
                                callbackCounter++;
                                if (callbackCounter == arrLength)
                                {
                                    callback(output);
                                }
                            }
                            else {
                                callbackCounter++;
                                if (callbackCounter == arrLength)
                                {
                                    callback(output);
                                }
                                console.log('error geting summary');
                            }
                    };
    	        })(tweetsGeo)
    	        );
		    }
		});
    }
}

var port = process.env.PORT;
var ip = process.env.IP;
app.listen(port, ip);

