'use strict';

L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
var venueMarkers = [];
var fromDate = +moment().format('X');
var toDate = +moment().add(3, 'months').format('X');
var minDate = +moment().subtract(2, 'months').format('X');
var maxDate = +moment().add(6, 'months').format('X');

map.setView([45.464262, 9.190802], 12);

$.getJSON('venues.json', function(data) {
  venueMarkers = setupMarkers(data['venues'], markerCallback);
  showVenues();
});

var setupMarkers = function(payloads, callback) {
  var markers = [];

  payloads.forEach(function(payload) {
    var marker = L.marker(payload['coords']);

    marker.bindPopup('<b>Nome: ' + payload['name'] + '</b>');
    marker.data = payload;
    marker.on('click', markerCallback);
    markers.push(marker);
  });

  return markers;
}

var hasEvents = function(info) {
  return info['events'].length && info['events'].some(function(event) {
    var start = new Date(event['startsAt']).getTime();

    return (start > fromDate * 1000) && (start < toDate * 1000);
  });
}

var showVenues = function() {
  venueMarkers.forEach(function(marker) {
    if (hasEvents(marker.data)) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
}

var markerCallback = function(e) {
  var data = e.target.data;

  map.panTo(e.latlng);

  console.log(data);

  $('#content h2').text("Hai selezionato: " + data.name);
}

var rangeSlider = $('#date-range').ionRangeSlider({
  type: 'double',
  force_edges: true,
  drag_interval: true,
  min: minDate,
  max: maxDate,
  from: fromDate,
  to: toDate,
  onChange: function(options) {
    fromDate = options.from;
    toDate = options.to;
    showVenues();
  },
  prettify: function(number) {
    return moment(number, 'X').format('LL');
  }
});
