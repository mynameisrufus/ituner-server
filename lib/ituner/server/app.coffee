App = {}
App.Collections = {}
App.Models      = {}
App.Views       = {}
App.Controllers = {}

App.Models.Track = Backbone.Model.extend
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

App.Models.CurrentTrack = Backbone.Model.extend
  url: '/status'

App.Collections.Requests = Backbone.Collection.extend
  model: App.Models.Track
  url: '/requests'

App.Collections.Search = Backbone.Collection.extend
  model: App.Models.Track
  url: '/search'
  search: (term)->
    collection = this
    $.ajax
      url: this.url,
      dataType: 'json',
      type: 'POST',
      data:
        term: term
      success: (xhr, type) ->
        collection.refresh resp
  request: (id) ->
    this.get(id).request()

App.Views.Status = Backbone.View.extend
  id: 'status'
  initialize: ->
    track = new App.Models.CurrentTrack
    track.fetch()
    this.intervalID = setInterval ( => track.fetch() ), 1000
    this.currentTrack = new App.Views.Track model: track
    this.el.appendChild this.currentTrack.render().el
    track.bind 'change', =>
      this.currentTrack.render()
  render: ->
    this

App.Views.Actions = Backbone.View.extend
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

App.Views.Search = Backbone.View.extend
  id: 'search'
  initialize: ->
    this.button = this.make "button", {}, "Find"
    this.searchBox = new App.Views.SearchBox
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

App.Views.SearchBox = Backbone.View.extend
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

App.Views.TrackRender = (view, trackView)->
  for track in view.tracks
    view.el.removeChild track.el
  view.tracks = []
  view.collection.each (track)=>
    newTrack = new trackView model: track
    view.tracks.push newTrack
  frag = document.createDocumentFragment()
  for track in view.tracks
    frag.appendChild track.render().el
  view.el.appendChild frag

App.Views.SearchResults = Backbone.View.extend
  id: 'search-results'
  initialize: ->
    this.tracks = []
    this.collection.bind 'refresh', => this.render()
  hide: ->
    $(this.el).hide()
  show: ->
    $(this.el).show()
  render: ->
    App.Views.TrackRender(this, App.Views.SearchTrack)
    $(this.el).show()
    this

App.Views.Requests = Backbone.View.extend
  id: 'requests'
  initialize: ->
    this.tracks = []
    this.collection.bind 'refresh', => this.render()
  hide: ->
    $(this.el).hide()
    clearInterval(this.intervalID)
  show: ->
    $(this.el).show()
    this.collection.fetch()
    this.intervalID = setInterval ( => this.collection.fetch() ), 5000
  render: ->
    App.Views.TrackRender(this, App.Views.Track)
    this

App.Views.Track = Backbone.View.extend
  className: "track"
  template: (track)->
    "<h3>#{track.name || '--'}</h3><p>#{track.artist || '--'} - <span>#{track.album || '--'}</span></p>"
  render: ->
    this.el.innerHTML = this.template this.model.toJSON()
    this

App.Views.SearchTrack = App.Views.Track.extend
  events:
    'click': 'request'
  request: ->
    unless this.requested
      this.el.className = this.className + ' requested'
      this.model.request()
    this.requested = true

App.Views.Player = Backbone.View.extend
  id: 'player'
  initialize: ->
    searchedTracks     = new App.Collections.Search
    requestedTracks    = new App.Collections.Requests
    this.status        = new App.Views.Status
    this.actions       = new App.Views.Actions
    this.search        = new App.Views.Search collection: searchedTracks
    this.searchResults = new App.Views.SearchResults collection: searchedTracks
    this.requests      = new App.Views.Requests collection: requestedTracks
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

App.Controllers.Player = Backbone.Controller.extend
  initialize: ->
    this.player = new App.Views.Player
    document.body.appendChild this.player.render().el

$(document).ready ->
  new App.Controllers.Player
