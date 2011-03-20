var Track = Backbone.Model.extend({

});

var Requests = Backbone.Collection.extend({
  model: Track
});

$(document).ready(function() {
  $.ajax({
    url: '/requests.json',
    success: function(data){
      //alert(data);
      //var requests = new Requests(data);
    }
  });
});
