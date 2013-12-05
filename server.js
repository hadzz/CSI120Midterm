var express = require('express');
var app = express();
var weathers = require('weathers');
var weather = require('weather.js/weather.js');
//var connect = require('connect');
var yrno = require('yr.no-forecast')
var fs = require('fs');
var Twit = require('twit');
var ce = require('cloneextend');
var geocoder = require('geocoder');
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
						twitReply = clone(reply);
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
							twitReply = clone(reply);
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
		if (twitReply.statuses[i].user.location && !twitReply.statuses[i].place)
		{
			tweetsNoGeo.push(twitReply.statuses[i]);
		}
		else if (twitReply.statuses[i].place)
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
                callback(output1Res + output2Res);
            });
        }
	);
	
	
}

function createNoGeoTable (output, callback)
{
    var callbackCounter = 0;
    var callbackCounter2 = 0;
    for (var i=0; i<tweetsNoGeo.length; i++) {
        var city = tweetsNoGeo[i].user.location;
        
		var arrLength = tweetsNoGeo.length;
        geocoder.geocode(city, function (err, data) {
            if (data && data.status != "OVER_QUERY_LIMIT" && data.status != "ZERO_RESULTS") {
                
                callbackCounter2++;
                console.log(data.results[0]);
                var longitude = data.results[0].geometry.location.lng;
	        	var latitude = data.results[0].geometry.location.lat;
	        	console.log("Lon: " + longitude + ", Lat: " + latitude);
	        	tweetsNoGeo[callbackCounter2 - 1]["aproxCity"] = data.results[0].formatted_address;
	        	yrno.getWeather({lat: latitude, lon: longitude}, function(err, location){
        		    if (err) {
        		        callbackCounter++;
        		        console.log('Error returning weather object');
        		        if (callbackCounter == callbackCounter2)
                        {
                            callback(output);
                        }
        		    }
        		    else {
            		    console.log("loading " + (callbackCounter+1) + " of " + callbackCounter2);
            	        location.getCurrentSummary((function(tweetsNoGeo){
                    	        return function(err2, data) {
                    	            if (!err2)
                    	            {
                    	                
                                        var tweet = tweetsNoGeo[callbackCounter];
                                        var score = analyze(tweet.text).score;
                                        output += "<tr class=\"data\">" +
                                        "<td style='text-align: center'>" + '<img src="' + tweet.user.profile_image_url + '"/>' +
                                        "</td>" +
                                        "<td style='text-align: center'>@" + tweet.user.screen_name +
                                        "</td>" +
                                        "<td>" + tweet.created_at + "</td>" +
                                        "<td>" + JSON.stringify(tweet.text, null, 4).replace(/["']/g, "") + "</td>" +
                                        "<td style='text-align: center'>" + score + "</td>" +
                                        "<td style='text-align: center'>" + tweet.aproxCity + " (APROX)</td>" +
                                        "<td style='text-align: center'>" + data.icon + "</td>" +
                                        "</tr>\n";
                                        callbackCounter++;
                                        if (callbackCounter == callbackCounter2)
                                        {
                                            callback(output);
                                        }
                                    }
                                    else {
                                        callbackCounter++;
                                        if (callbackCounter == callbackCounter2)
                                        {
                                            callback(output);
                                        }
                                        console.log('error geting summary');
                                    }
                            };
            	        })(tweetsNoGeo)
            	        );
        		    }
        		});
            }
        });
    }
}

function createGeoTable (output, callback)
{
    if (tweetsGeo.length == 0) {
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

function waitForCallback(output, callback)
{
    if (tweetsGeo.length==0) {
        callback("");
    }
    
    for (var i=0; i<tweetsGeo.length; i++) {
		if (i == 1)
		{
		    //console.log(tweetsNoGeo[i]);
		}
		
		
		if (tweetsGeo[i].coordinates)
		{
		    
		}
		else if (tweetsGeo[i].user.location)
		{
		    
		    
		}
		
		var condition = "N/A";
	    function writeData(city, longitude, latitude) {
    		
	    }
	}
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



var port = process.env.PORT;
var ip = process.env.IP;
app.listen(port, ip);

