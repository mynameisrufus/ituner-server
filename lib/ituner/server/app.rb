require 'haml'
require 'ituner'
require 'json'
require 'sinatra/base'
require 'sinatra/reloader'
require 'ituner/server/requests'
require 'eventmachine'

module ITuner
  module Server
    class App < Sinatra::Base
      
      def initialize
        EventMachine.run do 
          EM.add_periodic_timer(0.5) { keep_playing }
        end
        super
      end

    #  set :environment, :production
      set :app_file, __FILE__

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
          ITuner.itunes.music.search(name, only)
        end

        def track_data(track)
          { 
            :name   => track.name,
            :artist => track.artist,
            :album  => track.album,
            :id     => track.uid
          }
        end

        def playing?
          ITuner.itunes.playing?
        end
        
        def keep_playing
          Requests.play_next unless playing? 
        end

        def request_track
          uid = params["id"].to_i
          track = ITuner::Track.find_by_uid(uid)
          Requests.add_track(track)
        end
      end
      
      get '/style.css' do
        scss :style
      end
      
      get '/' do
        erb :layout
      end

      post '/search' do
        (search || []).map(&method(:track_data)).to_json
      end
      
      post "/request" do
        if request_track
          { success: "track added" }.to_json
        else
          { error: "bah boum" }.to_json
        end
      end

      get '/requests' do
        Requests.all.map(&:track).map(&method(:track_data)).to_json
      end

      get '/status' do
        current_track = ITuner.itunes.current_track
        unless current_track.nil?
          track_data(current_track).to_json
        else
          { error: "and there was silence..." }.to_json
        end
      end
    end
  end
end
