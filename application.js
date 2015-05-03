L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
map.setView([45.464262, 9.190802], 14);

var filterVenues = function(venues, options) {
  venues.filter(function(venue) {
  }, options);
}

$.getJSON('venues.json', function(data) {
  data['venues'].forEach(function(markerData, index) {
    var marker = L.marker(markerData['coords']);

    marker.bindPopup('<b>' + markerData['name'] + '</b>');
    marker['data'] = markerData;
    marker.addTo(map);

    marker.on('click', function(e) {
      map.panTo(e.latlng);
      console.log('Marker data:', marker);
    });
  });
});

$("#date-range").ionRangeSlider({
  type: 'double',
  force_edges: true,
  drag_interval: true,
  min: +moment().subtract(2, 'months').format('X'),
  max: +moment().add(6, 'months').format('X'),
  from: +moment().format('X'),
  to: +moment().add(3, 'months').format('X'),
  prettify: function(number) {
    return moment(number, 'X').format('LL');
  }
});
