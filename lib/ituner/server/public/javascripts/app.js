(function() {
  var Collections, Models, Player, Views;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Models = {};
  Collections = {};
  Views = {};
  Models.Track = (function() {
    __extends(Track, Backbone.Model);
    function Track() {
      Track.__super__.constructor.apply(this, arguments);
    }
    Track.prototype.url = '/request';
    Track.prototype.request = function() {
      return $.ajax({
        url: this.url,
        dataType: 'json',
        type: 'POST',
        data: this.toJSON(),
        success: __bind(function(body) {
          return this.trigger('request:success');
        }, this),
        error: __bind(function(xhr, type) {
          return this.trigger('request:failure', type);
        }, this)
      });
    };
    return Track;
  })();
  Models.CurrentTrack = (function() {
    __extends(CurrentTrack, Backbone.Model);
    function CurrentTrack() {
      CurrentTrack.__super__.constructor.apply(this, arguments);
    }
    CurrentTrack.prototype.url = '/status';
    return CurrentTrack;
  })();
  Collections.Requests = (function() {
    __extends(Requests, Backbone.Collection);
    function Requests() {
      Requests.__super__.constructor.apply(this, arguments);
    }
    Requests.prototype.model = Models.Track;
    Requests.prototype.url = '/requests';
    return Requests;
  })();
  Collections.Search = (function() {
    __extends(Search, Backbone.Collection);
    function Search() {
      Search.__super__.constructor.apply(this, arguments);
    }
    Search.prototype.model = Models.Track;
    Search.prototype.url = '/search';
    Search.prototype.search = function(term) {
      return this.fetch({
        data: {
          term: term
        },
        error: function(xhr, type) {
          return alert('server error');
        }
      });
    };
    Search.prototype.request = function(id) {
      return this.get(id).request();
    };
    return Search;
  })();
  Views.Track = (function() {
    __extends(Track, Backbone.View);
    function Track() {
      Track.__super__.constructor.apply(this, arguments);
    }
    Track.prototype.className = "track";
    Track.prototype.template = function(track) {
      return "<h3>" + (track.name || '--') + "</h3><p>" + (track.artist || '--') + " - <span>" + (track.album || '--') + "</span></p>";
    };
    Track.prototype.render = function() {
      this.el.innerHTML = this.template(this.model.toJSON());
      return this;
    };
    return Track;
  })();
  Views.SearchTrack = (function() {
    __extends(SearchTrack, Views.Track);
    function SearchTrack() {
      SearchTrack.__super__.constructor.apply(this, arguments);
    }
    SearchTrack.prototype.events = {
      'click': 'request'
    };
    SearchTrack.prototype.request = function() {
      if (!this.requested) {
        this.el.className = this.className + ' requested';
        this.model.request();
      }
      return this.requested = true;
    };
    return SearchTrack;
  })();
  Views.Status = (function() {
    __extends(Status, Backbone.View);
    function Status() {
      Status.__super__.constructor.apply(this, arguments);
    }
    Status.prototype.id = 'status';
    Status.prototype.initialize = function() {
      var track;
      track = new Models.CurrentTrack;
      track.fetch();
      this.intervalID = setInterval((__bind(function() {
        return track.fetch();
      }, this)), 1000);
      this.currentTrack = new Views.Track({
        model: track
      });
      this.el.appendChild(this.currentTrack.render().el);
      return track.bind('change', __bind(function() {
        return this.currentTrack.render();
      }, this));
    };
    Status.prototype.render = function() {
      return this;
    };
    return Status;
  })();
  Views.Actions = (function() {
    __extends(Actions, Backbone.View);
    function Actions() {
      Actions.__super__.constructor.apply(this, arguments);
    }
    Actions.prototype.id = 'actions';
    Actions.prototype.initialize = function() {
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
    };
    Actions.prototype.render = function() {
      return this;
    };
    return Actions;
  })();
  Views.Search = (function() {
    __extends(Search, Backbone.View);
    function Search() {
      Search.__super__.constructor.apply(this, arguments);
    }
    Search.prototype.id = 'search';
    Search.prototype.initialize = function() {
      this.button = this.make("button", {}, "Find");
      this.searchBox = new Views.SearchBox;
      this.button.addEventListener('click', __bind(function() {
        return this.search();
      }, this));
      this.searchBox.bind('search', __bind(function() {
        return this.search();
      }, this));
      this.el.appendChild(this.searchBox.render().el);
      return this.el.appendChild(this.button);
    };
    Search.prototype.search = function() {
      this.trigger('search');
      return this.collection.search(this.searchBox.el.value);
    };
    Search.prototype.render = function() {
      return this;
    };
    return Search;
  })();
  Views.SearchBox = (function() {
    __extends(SearchBox, Backbone.View);
    function SearchBox() {
      SearchBox.__super__.constructor.apply(this, arguments);
    }
    SearchBox.prototype.tagName = "input";
    SearchBox.prototype.value = "key words...";
    SearchBox.prototype.className = "waiting";
    SearchBox.prototype.events = {
      "focus": "message"
    };
    SearchBox.prototype.initialize = function() {
      return this.el.addEventListener('keypress', __bind(function(e) {
        if (e.which === 13) {
          return this.trigger('search');
        }
      }, this));
    };
    SearchBox.prototype.message = function() {
      if (this.el.value === this.value) {
        this.el.value = '';
        return this.el.className = '';
      }
    };
    SearchBox.prototype.render = function() {
      this.el.value = this.value;
      return this;
    };
    return SearchBox;
  })();
  Views.Table = (function() {
    __extends(Table, Backbone.View);
    function Table() {
      Table.__super__.constructor.apply(this, arguments);
    }
    Table.prototype.tracks = [];
    Table.prototype.initialize = function() {
      return this.collection.bind('reset', __bind(function() {
        return this.render();
      }, this));
    };
    Table.prototype.buildTracks = function() {
      var frag, model, newTrack, track, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      _ref = this.tracks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        track = _ref[_i];
        this.el.removeChild(track.el);
      }
      this.tracks = [];
      console.log(this);
      _ref2 = this.collection.models;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        model = _ref2[_j];
        newTrack = new this.cell({
          model: model
        });
        this.tracks.push(newTrack);
      }
      frag = document.createDocumentFragment();
      _ref3 = this.tracks;
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        track = _ref3[_k];
        frag.appendChild(track.render().el);
      }
      this.el.appendChild(frag);
      return this;
    };
    return Table;
  })();
  Views.SearchResults = (function() {
    __extends(SearchResults, Views.Table);
    function SearchResults() {
      SearchResults.__super__.constructor.apply(this, arguments);
    }
    SearchResults.prototype.id = 'search-results';
    SearchResults.prototype.cell = Views.SearchTrack;
    SearchResults.prototype.hide = function() {
      return $(this.el).hide();
    };
    SearchResults.prototype.show = function() {
      return $(this.el).show();
    };
    SearchResults.prototype.render = function() {
      this.buildTracks();
      $(this.el).show();
      return this;
    };
    return SearchResults;
  })();
  Views.Requests = (function() {
    __extends(Requests, Views.Table);
    function Requests() {
      Requests.__super__.constructor.apply(this, arguments);
    }
    Requests.prototype.id = 'requests';
    Requests.prototype.cell = Views.Track;
    Requests.prototype.hide = function() {
      $(this.el).hide();
      return clearInterval(this.intervalID);
    };
    Requests.prototype.show = function() {
      $(this.el).show();
      this.collection.fetch();
      return this.intervalID = setInterval((__bind(function() {
        return this.collection.fetch();
      }, this)), 5000);
    };
    Requests.prototype.render = function() {
      this.buildTracks();
      return this;
    };
    return Requests;
  })();
  Views.Player = (function() {
    __extends(Player, Backbone.View);
    function Player() {
      Player.__super__.constructor.apply(this, arguments);
    }
    Player.prototype.id = 'player';
    Player.prototype.initialize = function() {
      var requestedTracks, searchedTracks;
      searchedTracks = new Collections.Search;
      requestedTracks = new Collections.Requests;
      this.status = new Views.Status;
      this.actions = new Views.Actions;
      this.search = new Views.Search({
        collection: searchedTracks
      });
      this.searchResults = new Views.SearchResults({
        collection: searchedTracks
      });
      this.requests = new Views.Requests({
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
    };
    Player.prototype.render = function() {
      return this;
    };
    return Player;
  })();
  Player = function() {
    this.player = new Views.Player;
    return document.body.appendChild(this.player.render().el);
  };
  $(function() {
    return new Player;
  });
}).call(this);
