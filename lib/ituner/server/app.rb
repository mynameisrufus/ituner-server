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
      
      RESPONSE = {
        :error => [422, {:reponse => "error"}.to_json],
        :success => [201, {:reponse => "success"}.to_json]
      }

      def initialize
        EventMachine.run do 
          EM.add_periodic_timer(0.5) { keep_playing }
        end
        super
      end

      set :environment, :production
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

        def request_track(uid)
          track = ITuner::Track.find_by_uid(uid)
          Requests.add_track(track)
        end

        def upvote_track(uid)
          true
        end

        def downvote_track(uid)
          true
        end

        def kill_track(uid)
          true
        end
        
        def track_action(action)
          if !params["id"].nil? && respond_to?(action)
            send(action, params['id'].to_i) ? RESPONSE[:success] : RESPONSE[:error]
          else
            RESPONSE[:error]
          end
        end
      end
      
      get '/style.css' do
        scss :style
      end
      
      get '/' do
        erb :layout
      end
      
      # ==track actions
      # * request
      # * vote up
      # * vote down
      # * kill track (currently playing track or requested track
      #
      post "/request" do
        track_action :request_track
      end

      post "/upvote" do
        track_action :upvote_track
      end

      post "/downvote" do
        track_action :downvote_track
      end

      post "/kill" do
        track_action :kill_track
      end
      
      # == player status
      # returns the current playing track
      #
      get '/status' do
        current_track = ITuner.itunes.current_track
        unless current_track.nil?
          track_data(current_track).to_json
        else
          RESPONSE[:success]
        end
      end     
      
      # == return collections
      #
      get '/search' do
        (search || []).map(&method(:track_data)).to_json
      end

      get '/requests' do
        Requests.all.map(&:track).map(&method(:track_data)).to_json
      end
    end
  end
end
