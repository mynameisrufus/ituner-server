Models = {}
Collections = {}
Views= {}

class Models.Track extends Backbone.Model
  url: '/request'
  request: ->
    $.ajax
      url: this.url,
      dataType: 'json',
      type: 'POST',
      data: this.toJSON()
      success: (body)=>
        this.trigger('request:success')
      error: (xhr, type)=>
        this.trigger('request:failure', type)

class Models.CurrentTrack extends Backbone.Model
  url: '/status'

class Collections.Requests extends Backbone.Collection
  model: Models.Track
  url: '/requests'

class Collections.Search extends Backbone.Collection
  model: Models.Track
  url: '/search'
  search: (term)->
    this.fetch
      data:
        term: term
      error: (xhr, type) ->
        alert 'server error'
  request: (id) ->
    this.get(id).request()

class Views.Track extends Backbone.View
  className: "track"
  template: (track)->
    "<h3>#{track.name || '--'}</h3><p>#{track.artist || '--'} - <span>#{track.album || '--'}</span></p>"
  render: ->
    this.el.innerHTML = this.template this.model.toJSON()
    this

class Views.SearchTrack extends Views.Track
  events:
    'click': 'request'
  request: ->
    unless this.requested
      this.el.className = this.className + ' requested'
      this.model.request()
    this.requested = true

class Views.Status extends Backbone.View
  id: 'status'
  initialize: ->
    track = new Models.CurrentTrack
    track.fetch()
    this.intervalID = setInterval ( => track.fetch() ), 1000
    this.currentTrack = new Views.Track model: track
    this.el.appendChild this.currentTrack.render().el
    track.bind 'change', =>
      this.currentTrack.render()
  render: ->
    this

class Views.Actions extends Backbone.View
  id: 'actions'
  initialize: ->
    this.searches = document.createElement 'button'
    this.searches.innerHTML = 'Request'
    this.searches.addEventListener 'click', =>
      this.trigger 'show:searches'
    this.el.appendChild this.searches
    this.requests = document.createElement 'button'
    this.requests.innerHTML = 'Vote'
    this.requests.addEventListener 'click', =>
      this.trigger 'show:requests'
    this.el.appendChild this.requests
  render: ->
    this

class Views.Search extends Backbone.View
  id: 'search'
  initialize: ->
    this.button = this.make "button", {}, "Find"
    this.searchBox = new Views.SearchBox
    this.button.addEventListener 'click', =>
      this.search()
    this.searchBox.bind 'search', =>
      this.search()
    this.el.appendChild this.searchBox.render().el
    this.el.appendChild this.button
  search: ->
    this.trigger 'search'
    this.collection.search this.searchBox.el.value
  render: ->
    this

class Views.SearchBox extends Backbone.View
  tagName: "input"
  value: "key words..."
  className: "waiting"
  events:
    "focus" : "message"
  initialize: ->
    this.el.addEventListener 'keypress', (e)=>
      this.trigger 'search' if e.which == 13
  message: ->
    if this.el.value == this.value
      this.el.value = ''
      this.el.className = ''
  render: ->
    this.el.value = this.value
    this

class Views.Table extends Backbone.View
  tracks: []
  initialize: ->
    @collection.bind 'reset', => this.render()
  buildTracks: ->
    for track in @tracks
      @el.removeChild track.el
    @tracks = []
    console.log this
    for model in @collection.models
      newTrack = new @cell model: model
      @tracks.push newTrack
    frag = document.createDocumentFragment()
    for track in @tracks
      frag.appendChild track.render().el
    @el.appendChild frag
    this

class Views.SearchResults extends Views.Table
  id: 'search-results'
  cell: Views.SearchTrack
  hide: ->
    $(this.el).hide()
  show: ->
    $(this.el).show()
  render: ->
    this.buildTracks()
    $(this.el).show()
    this

class Views.Requests extends Views.Table
  id: 'requests'
  cell: Views.Track
  hide: ->
    $(this.el).hide()
    clearInterval(this.intervalID)
  show: ->
    $(this.el).show()
    this.collection.fetch()
    this.intervalID = setInterval ( => this.collection.fetch() ), 5000
  render: ->
    this.buildTracks()
    this

class Views.Player extends Backbone.View
  id: 'player'
  initialize: ->
    searchedTracks     = new Collections.Search
    requestedTracks    = new Collections.Requests
    this.status        = new Views.Status
    this.actions       = new Views.Actions
    this.search        = new Views.Search collection: searchedTracks
    this.searchResults = new Views.SearchResults collection: searchedTracks
    this.requests      = new Views.Requests collection: requestedTracks
    this.searchResults.hide()
    this.search.bind 'search', =>
      this.requests.hide()
      this.searchResults.show()
    this.actions.bind 'show:searches', =>
      this.requests.hide()
      this.searchResults.show()
    this.actions.bind 'show:requests', =>
      this.requests.show()
      this.searchResults.hide()
    this.el.appendChild this.status.render().el
    this.el.appendChild this.search.render().el
    this.el.appendChild this.actions.render().el
    this.el.appendChild this.searchResults.el
    this.el.appendChild this.requests.el
  render: ->
    this

Player = ->
  @player = new Views.Player
  document.body.appendChild @player.render().el

$ ->
  new Player
