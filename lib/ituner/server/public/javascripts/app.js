(function() {
  var App;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  App = {};
  App.Collections = {};
  App.Models = {};
  App.Views = {};
  App.Controllers = {};
  App.Models.Track = Backbone.Model.extend({
    url: '/request',
    request: function() {
      return $.ajax({
        url: this.url,
        type: 'POST',
        data: this.toJSON(),
        success: function(resp, status, xhr) {
          return console.log(resp);
        }
      });
    }
  });
  App.Models.CurrentTrack = Backbone.Model.extend({
    url: '/status'
  });
  App.Collections.Requests = Backbone.Collection.extend({
    model: App.Models.Track,
    url: '/requests'
  });
  App.Collections.Search = Backbone.Collection.extend({
    model: App.Models.Track,
    url: '/search',
    search: function(term) {
      var collection;
      collection = this;
      return $.ajax({
        url: this.url,
        dataType: 'json',
        type: 'POST',
        data: {
          term: term
        },
        success: function(resp, status, xhr) {
          return collection.refresh(resp);
        }
      });
    },
    request: function(id) {
      return this.get(id).request();
    }
  });
  App.Views.Status = Backbone.View.extend({
    id: 'status',
    initialize: function() {
      var track;
      track = new App.Models.CurrentTrack;
      track.fetch();
      console.log(track.url);
      this.intervalID = setInterval((__bind(function() {
        return track.fetch();
      }, this)), 1000);
      this.currentTrack = new App.Views.Track({
        model: track
      });
      this.el.appendChild(this.currentTrack.render().el);
      return track.bind('change', __bind(function() {
        return this.currentTrack.render();
      }, this));
    },
    render: function() {
      return this;
    }
  });
  App.Views.Actions = Backbone.View.extend({
    id: 'actions',
    initialize: function() {
      this.searches = document.createElement('button');
      this.searches.innerHTML = 'Request';
      this.searches.addEventListener('click', __bind(function() {
        return this.trigger('show:searches');
      }, this));
      this.el.appendChild(this.searches);
      this.requests = document.createElement('button');
      this.requests.innerHTML = 'Vote';
      this.requests.addEventListener('click', __bind(function() {
        return this.trigger('show:requests');
      }, this));
      return this.el.appendChild(this.requests);
    },
    render: function() {
      return this;
    }
  });
  App.Views.Search = Backbone.View.extend({
    id: 'search',
    initialize: function() {
      this.button = this.make("button", {}, "Find");
      this.searchBox = new App.Views.SearchBox;
      this.button.addEventListener('click', __bind(function() {
        return this.search();
      }, this));
      this.searchBox.bind('search', __bind(function() {
        return this.search();
      }, this));
      this.el.appendChild(this.searchBox.render().el);
      return this.el.appendChild(this.button);
    },
    search: function() {
      this.trigger('search');
      return this.collection.search(this.searchBox.el.value);
    },
    render: function() {
      return this;
    }
  });
  App.Views.SearchBox = Backbone.View.extend({
    tagName: "input",
    value: "key words...",
    className: "waiting",
    events: {
      "focus": "message"
    },
    initialize: function() {
      return this.el.addEventListener('keypress', __bind(function(e) {
        if (e.which === 13) {
          return this.trigger('search');
        }
      }, this));
    },
    message: function() {
      if (this.el.value === this.value) {
        this.el.value = '';
        return this.el.className = '';
      }
    },
    render: function() {
      this.el.value = this.value;
      return this;
    }
  });
  App.Views.TrackRender = function(view, trackView) {
    var track, _i, _j, _len, _len2, _ref, _ref2, _results;
    _ref = view.tracks;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      track = _ref[_i];
      view.el.removeChild(track.el);
    }
    view.tracks = [];
    view.collection.each(__bind(function(track) {
      var newTrack;
      newTrack = new trackView({
        model: track
      });
      return view.tracks.push(newTrack);
    }, this));
    _ref2 = view.tracks;
    _results = [];
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      track = _ref2[_j];
      _results.push(view.el.appendChild(track.render().el));
    }
    return _results;
  };
  App.Views.SearchResults = Backbone.View.extend({
    id: 'search-results',
    initialize: function() {
      this.tracks = [];
      return this.collection.bind('refresh', __bind(function() {
        return this.render();
      }, this));
    },
    hide: function() {
      return $(this.el).hide();
    },
    show: function() {
      return $(this.el).show();
    },
    render: function() {
      App.Views.TrackRender(this, App.Views.SearchTrack);
      $(this.el).show();
      return this;
    }
  });
  App.Views.Requests = Backbone.View.extend({
    id: 'requests',
    initialize: function() {
      this.tracks = [];
      return this.collection.bind('refresh', __bind(function() {
        return this.render();
      }, this));
    },
    hide: function() {
      $(this.el).hide();
      return clearInterval(this.intervalID);
    },
    show: function() {
      $(this.el).show();
      this.collection.fetch();
      return this.intervalID = setInterval((__bind(function() {
        return this.collection.fetch();
      }, this)), 5000);
    },
    render: function() {
      App.Views.TrackRender(this, App.Views.Track);
      return this;
    }
  });
  App.Views.Track = Backbone.View.extend({
    className: "track",
    template: function(track) {
      return "<h3>" + track.name + "</h3><p>" + track.artist + " - <span>" + track.album + "</span></p>";
    },
    render: function() {
      this.el.innerHTML = this.template(this.model.toJSON());
      return this;
    }
  });
  App.Views.SearchTrack = App.Views.Track.extend({
    events: {
      'click': 'request'
    },
    request: function() {
      if (!this.requested) {
        this.el.className = this.className + ' requested';
        this.model.request();
      }
      return this.requested = true;
    }
  });
  App.Views.Player = Backbone.View.extend({
    id: 'player',
    initialize: function() {
      var requestedTracks, searchedTracks;
      searchedTracks = new App.Collections.Search;
      requestedTracks = new App.Collections.Requests;
      this.status = new App.Views.Status;
      this.actions = new App.Views.Actions;
      this.search = new App.Views.Search({
        collection: searchedTracks
      });
      this.searchResults = new App.Views.SearchResults({
        collection: searchedTracks
      });
      this.requests = new App.Views.Requests({
        collection: requestedTracks
      });
      this.searchResults.hide();
      this.search.bind('search', __bind(function() {
        this.requests.hide();
        return this.searchResults.show();
      }, this));
      this.actions.bind('show:searches', __bind(function() {
        this.requests.hide();
        return this.searchResults.show();
      }, this));
      this.actions.bind('show:requests', __bind(function() {
        this.requests.show();
        return this.searchResults.hide();
      }, this));
      this.el.appendChild(this.status.render().el);
      this.el.appendChild(this.search.render().el);
      this.el.appendChild(this.actions.render().el);
      this.el.appendChild(this.searchResults.el);
      return this.el.appendChild(this.requests.el);
    },
    render: function() {
      return this;
    }
  });
  App.Controllers.Player = Backbone.Controller.extend({
    initialize: function() {
      this.player = new App.Views.Player;
      return document.body.appendChild(this.player.render().el);
    }
  });
  $(document).ready(function() {
    return new App.Controllers.Player;
  });
}).call(this);
