L.mapbox.accessToken = 'pk.eyJ1IjoibGlxdWlkMTk4MiIsImEiOiJCdmxWQkZNIn0.itcodaqRcLopL_0WP5Rjww';

var map = L.mapbox.map('map', 'examples.map-i86nkdio');
// map.setView([42.5, 13], 8);

$.getJSON('data.json', function(data) {
  map.setView(data['markers'][0]['coords'], 13);

  $(data['markers']).each(function(index, markerData) {
    var marker = L.marker(markerData['coords']);
    marker.bindPopup('<b>' + markerData['title'] + '</b>');
    marker.addTo(map);

    marker.on('click', function(e) {
      map.panTo(e.latlng);
    });
  });
});
