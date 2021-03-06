require 'action_controller'
require 'active_support/dependencies'

module RendersTemplates
  class DummyController < AbstractController::Base
    include AbstractController::Rendering
    include AbstractController::Layouts
    include AbstractController::Helpers
    include AbstractController::Translation
    include AbstractController::AssetPaths
    include AbstractController::Logger
    include ActionDispatch::Routing
    include Rails.application.routes.url_helpers

    helper ApplicationHelper

    self.view_paths = ["#{Rails.root}/app/views"].tap do |paths|
      ActiveSupport::Dependencies.plugins_loader.engine_paths.each do |path|
          paths << "#{path}/app/views"
      end
    end
    self.assets_dir = "#{Rails.root}/public"
    self.javascripts_dir = "#{self.assets_dir}/javascripts"
    self.javascripts_dir = "#{self.assets_dir}/stylesheets"

    def _render(args=nil)
      render_to_string args
    end

    def params
      {}
    end

    ActiveSupport.run_load_hooks(:dummy_controller, self)
  end

  def get_renderer
    @@controller ||= DummyController.new
  end

  def render_to_string(args=nil)
    get_renderer._render args
  end

  def head_assets
    @@head_assets ||= get_renderer._render partial: 'shared/head_assets'
  end

  def body_assets
    @@body_assets ||= get_renderer._render partial: 'shared/body_assets'
  end

  def add_body_class_to(html, classname)
    body_tag = html.scan(/\<body[^>]*\>/)[0]
    return html unless body_tag.present?
    if body_tag.include? 'class='
      html = html.sub(body_tag, body_tag.sub(/ class=\"([^\"]+)\"/, " class=\"#{$1} #{classname}\""))
    else
      html = html.sub(body_tag, body_tag.sub('body', "body class=\"#{classname}\""))
    end
  end
end
