require 'haml'
require 'ituner'
require 'json'
require 'sinatra/base'
require 'sinatra/reloader'
require 'ituner/server/requests'

module ITuner
  module Server
    class App < Sinatra::Base

      set :app_file, __FILE__
      set :haml, :format => :html5

      configure(:development) do
        register Sinatra::Reloader
      end

      helpers do

        def search
          search_term = params["term"]
          return nil if search_term.to_s.empty?
          case search_term
          when /^album:(.*)/
            only = :albums
            name = $1
          when /^artist:(.*)/
            only = :artists
            name = $1
          when /^(?:track|song|name):(.*)/
            only = :songs
            name = $1
          else
            only = :all
            name = search_term
          end
          @search_results = ITuner.itunes.music.search(name, only)
        end

        def playing?
          ITuner.itunes.playing?
        end
        
        def keep_playing
          Requests.play_next unless playing? 
        end

        def request_track
          params["track_uids"].each do |track_uid|
            track = ITuner::Track.find_by_uid(Integer(track_uid))
            Requests.add_track(track)
          end
        end
      end

      get '/style.css' do
        scss :style
      end

      get '/' do
        keep_playing
        if playing?
          @current_track = ITuner.itunes.current_track
        end
        @requests = Requests.all
        search
        haml :home
      end
      
      post "/request" do
        request_track
        redirect to("/")
      end

      get '/bb' do # backbone version of index
        haml :bb
      end
      
      get '/status.json' do
        ITuner.itunes.current_track.to_json
      end

      get '/requests.json' do
        Requests.all.to_json
      end

      get '/search.json' do
        search.to_json
      end

      post '/request.json' do
        request_track.to_json
      end
      
    end
  end
end
