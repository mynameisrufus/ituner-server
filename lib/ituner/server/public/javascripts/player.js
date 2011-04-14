var Track = Backbone.Model.extend({

});

var PlayerController = Backbone.Controller.extend({
  
  initialize: function(options) {
    this.container = document.createElement('div');
    this.container.id = "player"
    document.body.appendChild(this.container);
    this.build();
    return this;
  },
  
  build: function() {
    this.status = new Status({id: "status"});
    $(this.container).append(this.status.render());
    
    this.actions = new Actions({id: "actions"});
    $(this.container).append(this.actions.render());
    
    this.search = new Search({id: "search"});
    $(this.container).append(this.search.render());


    this.poll();
  },

  poll: function() {
    this.pollStatus();
  },

  pollStatus: function() {
    if (this.pollStatusTimeout == undefined) {
      this.updateStatus();
    }
    this.pollStatusTimeout = setTimeout(_.bind(function() {
      this.updateStatus();
    }, this), 5000);
    return this;
  },

  updateStatus: function(callback) {
    $.ajax({
      url: "/status",
      dataType: 'json',
      success: _.bind(function(data) {
        if (data.error) {
          $(this.status.el).html(data.error);
        } else {
          var track = new Track(data);
          this.status.render(track);
        }
        return this;
      }, this)
    })
  }
});

var Status = Backbone.View.extend({
  template: function(track) {
  
  },

  render: function(track) {
    return this.el;
  }
});

var SearchBox = Backbone.View.extend({
  tagName: "input",
  
  value: "search for a song...",
  
  className: "waiting",

  events: {
    "focus" : "message"
  },

  message: function() {
    if (this.el.value == this.value) {
      this.el.value = '';
      this.el.className = '';
    }
  },

  render: function() {
    this.el.value = this.value;
    return this.el;
  }
});

var Search = Backbone.View.extend({
  template: function() {
    var input = new SearchBox({id: "search-query"});

    var button = this.make("button", {
      class: "slick-black"
    }, "Search");

    $(this.el).
      append(input.render()).
      append(button);

    return this.el;
  },

  render: function(track) {
    return this.template();
  }
});

var ActionButton = Backbone.View.extend({
  
  tagName: "button",
  
  className: "clean-gray",
  
  render: function() {
    $(this.el).html(this.options.name);
    return this.el;
  },
  
  events: {
    "click" : "show"
  },

  show: function() {
    $("#" + this.options.panel_id).show();
    return this;
  }
});

var Actions = Backbone.View.extend({
  template: function(){
    var search_button = new ActionButton({
      name: "Search Results",
      id: "search-button",
      panel_id: "search-results"
    });

    var requests_button = new ActionButton({
      name: "Requests",
      id: "requests-button",
      panel_id: "requests"
    });

    $(this.el)
      .append(search_button.render())
      .append(requests_button.render());
    
    return this.el;
  },

  render: function() {
    return this.template();
  }
});


$(document).ready(function() {
  controller = new PlayerController;
});
