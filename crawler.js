var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var baseUrl = 'http://www.milanodabere.it';
var paths = [
  '/milano/teatri',
  '/milano/teatri/2',
  '/milano/teatri/3',
  '/milano/teatri/4',
  '/milano/teatri/5'
];

var fetchVenues = function(path, callback) {
  request(baseUrl + path, function(error, response, body) {
    var venues = [];
    var $ = cheerio.load(body);
    var elements = $('#mdb_lista > article');

    elements.each(function(index, element) {
      var venue = {};
      var addressLink
      var tokens;
      var latitude;
      var longitude;

      addressLink = $('header > div.media-body > aside > div > a:nth-child(2)', element).attr('href');
      tokens = addressLink.split('?');
      tokens = tokens[1].split('&');
      latitude = tokens[0].split('=')[1];
      longitude = tokens[1].split('=')[1];

      venue.name = $('header h1 > a', element).text();
      venue.coords = [parseFloat(latitude), parseFloat(longitude)];

      venues.push(venue);
    });

    callback(null, venues);
  });
}

async.map(paths, fetchVenues, function(error, result) {
  var venues = result.reduce(function(a, b) {
    return a.concat(b);
  });

  fs.writeFile('venues.json', JSON.stringify({venues: venues}, null, 2), function(error) {
    if (!error) {
      console.log('All venues have been written to venues.json file!');
    } else {
      console.log('Error writing venues.json!', error);
    }
  });
});
