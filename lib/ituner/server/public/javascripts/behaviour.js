$(document).ready(function() {

  // $("#track-search").autocomplete({
  //   source: '/search.json'
  // });

});

var Track = Backbone.Model.extend({

});

var Playlist = Backbone.Collection.extend({
  model: Track
});
