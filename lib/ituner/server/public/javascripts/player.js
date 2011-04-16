(function(){
  var PlayerController = Backbone.Controller.extend({
    
    requestsPollInt: 5000,

    statusPollInt: 1000,

    initialize: function(options) {
      // create container element
      this.container = document.createElement('div');
      this.container.id = "player"
      document.body.appendChild(this.container);

      // make the player
      this.build();
      return this;
    },
    
    build: function() {
      // create all the views
      this.status = new View.Status({id: "status"});
      this.actions = new View.Actions({id: "actions"});
      this.search = new View.Search({id: "search"});
      this.searchResults = document.createElement('div');
      this.searchResults.id = "search-results";
      this.requests = document.createElement('div');
      this.requests.id = "requests";
      
      // add
      $(this.container)
        .append(this.status.render())
        .append(this.actions.render())
        .append(this.search.render())
        .append(this.searchResults)
        .append(this.requests);
      
      // add events
      this.addToggleToActions();
      this.searchEventListeners();
      this.poll();
      return this;
    },

    searchEventListeners: function() {
      $(this.search.button).click(_.bind(this.searchForTracks, this));
      $(this.search.input.el).keypress(_.bind(function(e){
        if(e.which == 13){
          this.searchForTracks();
        }
      }, this));
      return this;
    },

    addToggleToActions: function() {
      $(this.actions.search_button.el).click(_.bind(function() {
        $(this.searchResults).show();
        $(this.requests).hide();
      }, this));
      $(this.actions.requests_button.el).click(_.bind(function() {
        $(this.searchResults).hide();
        $(this.requests).show();
      }, this));
      return this;
    },

    poll: function() {
      this.pollStatus();
      this.pollRequests();
      return this;
    },

    pollStatus: function() {
      if (this.pollStatusTimeout == undefined) {
        this.updateStatus();
      }
      this.pollStatusTimeout = setTimeout(_.bind(function() {
        this.updateStatus().pollStatus();
      }, this), this.statusPollInt);
      return this;
    },
    
    pollRequests: function() {
      if (this.pollRequestsTimeout == undefined) {
        this.getRequests();
      }
      this.pollRequestsTimeout = setTimeout(_.bind(function() {
        this.getRequests().pollRequests();
      }, this), this.requestsPollInt);
      return this;
    },

    getRequests: function() {
      $.ajax({
        url: '/requests',
        dataType: 'json',
        success: _.bind(function(dataSet) {
          $(this.requests).html('');
          _.each(dataSet, function(data) {
            var track = new View.Track();
            track.uid = data.uid;
            $(this.requests).append(track.render(data));
          }, this);
          return this;
        }, this)
      });
      return this;
    },

    searchForTracks: function() {
      $(this.requests).hide();
      $(this.searchResults).show();
      $.ajax({
        url: '/search',
        dataType: 'json',
        type: 'POST',
        data: { 
          term: this.search.input.el.value
        },
        success: _.bind(function(dataSet) {
          $(this.searchResults).html('');
          _.each(dataSet, function(data) {
            var track = new View.Track({type: 'request'});
            track.uid = data.uid;
            $(this.searchResults).append(track.render(data));
          }, this);
          return this;
        }, this)
      });
      return this;
    },

    updateStatus: function() {
      $.ajax({
        url: "/status",
        dataType: 'json',
        success: _.bind(function(data) {
          this.updateTitle(data);
          if (data.error) {
            this.status.render(data.error);
          } else {
            var track = new View.Track();
            track.uid = data.uid;
            this.status.render(track.render(data));
          }
          return this;
        }, this)
      })
      return this;
    },

    updateTitle: function(data) {
      if (this.doc_title === undefined) {
        this.doc_title = document.title;
      }
      if (data.error !== undefined) {
        document.title = this.doc_title + ' - ' + data.error;
      } else if (data.artist !== undefined) {
        document.title = this.doc_title + ' - ' + data.artist;
      } else {
        document.title = this.doc_title;
      }
    }
  });

  // Views
  var View = {
    Status: Backbone.View.extend({
      render: function(content) {
        $(this.el).html(content);
        return this.el;
      }
    }),
    
    Track: Backbone.View.extend({
      className: "track",
      template: function(track) {
        var title = this.make("h3", null, track.name);
        $(this.el).html(title);
        if (track.artist) {
          var artist = this.make("p", null, track.artist);
          if (track.album) {
            var album = this.make("span", null, (" - " + track.album));
            $(artist).append(album);
          }
          $(this.el).append(artist);
        }
        return this.el;
      },
      render: function(track) {
        this.template(track);
        return this.el;
      },
      events: {
        "click" : "clickEvent"
      },
      clickEvent: function() {
        if (this.options.type !== undefined) {
          switch (this.options.type) {
            case 'request':
              this.request();
              break;
          } 
        }
      },
      request: function() {
        $.post('/request', { uid: this.uid });
        $(this.el).animate({
          opacity: 0.25,
          left: '+=600',
          height: '0px'
        }, 1000, _.bind(function() {
          this.remove();
          // Animation complete.
        }, this));
      }
    }),

    SearchBox: Backbone.View.extend({
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
    }),

    Search: Backbone.View.extend({
      template: function() {
        this.input = new View.SearchBox({id: "search-query"});
        this.button = this.make("button", {}, "Search");
        $(this.el).
          append(this.input.render()).
          append(this.button);
        return this.el;
      },
      render: function(track) {
        return this.template();
      }
    }),

    ActionButton: Backbone.View.extend({
      tagName: "button",
      render: function() {
        $(this.el).html(this.options.name);
        return this.el;
      }
    }),

    Actions: Backbone.View.extend({
      template: function(){
        this.search_button = new View.ActionButton({
          name: "Search",
          id: "search-button"
        });
        this.requests_button = new View.ActionButton({
          name: "Requests",
          id: "requests-button",
        });
        $(this.el)
          .append(this.search_button.render())
          .append(this.requests_button.render());
        return this.el;
      },
      render: function() {
        return this.template();
      }
    })
  }

  $(document).ready(function() {
    controller = new PlayerController;
  });

})();
