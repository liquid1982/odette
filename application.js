L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var markers = [];
var markerInstances = [];
var startDate = +moment().format('X');
var endDate = +moment().add(3, 'months').format('X');
var minDate = +moment().subtract(2, 'months').format('X');
var maxDate = +moment().add(6, 'months').format('X');
var map = L.mapbox.map('map', 'examples.map-i86nkdio');

map.setView([45.464262, 9.190802], 14);

var hasEvents = function(markerData) {
  return markerData['events'].length && markerData['events'].some(function(event) {
    var start = new Date(event['startsAt']).getTime() > startDate * 1000;
    var end = new Date(event['endsAt']).getTime() < endDate * 1000;

    return start && end;
  });
}

var showMarkers = function() {
  markerInstances.forEach(function(marker) {
    map.removeLayer(marker);
  });

  markers.forEach(function(markerData) {
    if (hasEvents(markerData)) {
      var marker = L.marker(markerData['coords']);

      marker.bindPopup('<b>' + markerData['name'] + '</b>');
      marker.addTo(map);

      marker.on('click', function(e) {
        map.panTo(e.latlng);
        console.log('Marker data:', marker);
      });

      markerInstances.push(marker);
    } else {
      console.log('This markers has no events in the specified time range.', marker);
    }
  });
}

$.getJSON('venues.json', function(data) {
  markers = data['venues'];
  showMarkers();
});

var rangeSlider = $("#date-range").ionRangeSlider({
  type: 'double',
  force_edges: true,
  drag_interval: true,
  min: minDate,
  max: maxDate,
  from: startDate,
  to: endDate,
  onChange: function(data) {
    startDate = data.from;
    endDate = data.to;
    showMarkers();
  },
  prettify: function(number) {
    return moment(number, 'X').format('LL');
  }
});
