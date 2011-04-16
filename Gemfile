source "http://rubygems.org"

# Specify your gem's dependencies in ituner-server.gemspec
gemspec

gem "ituner", :path => "../ituner"
gem "json"
gem "eventmachine", "0.12.10"

group :development do
  gem "thin"
  gem "sinatra-reloader"
end

group :test do
  gem "rake"
  gem "rspec"
  gem "capybara"
  gem "rspec2-rails-views-matchers"
  gem "launchy"
end
