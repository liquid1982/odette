'use strict';

L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
var venueMarkers = [];
var currentMarker;
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
  currentMarker = e.target;

  var data = e.target.data;
  var timeout = ($('#map').hasClass('small')) ? 0 : 1000;

  setTimeout(function() {
    map.invalidateSize();
    map.panTo(e.latlng);
  }, timeout);

  $('#map').addClass('small');
  $('#content ul').remove();

  var html = "<ul>";

  data.events.forEach(function(event, i) {
    html += "<li>" + event['title'] + "</li>";
  });

  html += "</ul>";

  $('#content h2').addClass('selected');
  $('#content h2').text("Hai selezionato: " + data.name);
  $('#content').append(html);
}

$('#back').on('click', function(e) {
  $('#map').removeClass('small');
  $('#content h2').text('Welcome!');
  $('#content h2').removeClass('selected');
  $('#content ul').remove();

  setTimeout(function() {
    var coords = currentMarker.getLatLng();
    map.invalidateSize();
    map.panTo([coords.lat, coords.lng]);
  }, 1000);
});

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
