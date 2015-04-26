L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
// map.setView([42.5, 13], 8);

$.getJSON('venues.json', function(data) {
  map.setView(data['venues'][0]['coords'], 13);

  data['venues'].forEach(function(markerData, index) {
    var marker = L.marker(markerData['coords']);

    marker.bindPopup('<b>' + markerData['name'] + '</b>');
    marker.addTo(map);

    marker.on('click', function(e) {
      map.panTo(e.latlng);
    });
  });
});

$("#date-range").ionRangeSlider({
  type: 'double',
  min: +moment().subtract(2, 'months').format('X'),
  max: +moment().add(6, 'months').format('X'),
  from: +moment().format('X'),
  to: +moment().add(3, 'months').format('X'),
  force_edges: true,
  drag_interval: true,
  prettify: function(number) {
    return moment(number, 'X').format('LL');
  }
});
