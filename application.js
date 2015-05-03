L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
var venueMarkers = [];
var fromDate = +moment().format('X');
var toDate = +moment().add(3, 'months').format('X');
var minDate = +moment().subtract(2, 'months').format('X');
var maxDate = +moment().add(6, 'months').format('X');

map.setView([45.464262, 9.190802], 14);

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

var setupMarkers = function(payloads) {
  var markers = [];

  payloads.forEach(function(payload) {
    var marker = L.marker(payload['coords']);
    marker.data = payload;
    marker.bindPopup('<b>' + payload['name'] + '</b>');
    marker.on('click', function() { map.panTo(e.latlng); });
    markers.push(marker);
  });

  return markers;
}

$.getJSON('venues.json', function(data) {
  venueMarkers = setupMarkers(data['venues']);
  showVenues();
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
