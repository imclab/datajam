/**
 * Datajam build file
 * Do not edit this file directly -- run `rake build_javascripts`
 */

(function($, define, require){

/*jshint laxcomma:true, expr:true, evil:true */

(function(define, require, $, window, undefined){

  define('datajam/init', [], function(){
    _.mixin({
      /**
       * takes a string classpath and returns a matching object
       * from the passed-in scope.
       */
      constantize: function(str, scope){
        scope || (scope = window);
        var parts = str.split('.');
        _.each(parts, function(part, i, parts){
          scope = scope[part];
        });

        return scope;
      },
      /**
       * takes a string classpath and returns a string file path
       * relative to the passed-in root, suitable for requiring
       * modules using require.js
       */
      pathify: function(str, root){
        root || (root = '');
        var parts = str.split(/([A-Z]+|\.)/).slice(1);
        _.each(parts, function(part, i, parts){
          if(part.match(/[A-Z]+/)){
            if(root.match(/[a-z]$/)){
              root += '_';
            }
            root += part.toLowerCase();
          }else if(part == '.'){
            root += '/';
          }else{
            root += part;
          }
        });

        // if the path starts with datajam, but is not part of the datajam app,
        // (i.e., it's a plugin) strip datajam from the name.
        if(root.match(/^datajam\//) &&
          !root.match(/^datajam\/(views|models|collections|templates|init|libs)/)){
          root = root.replace('datajam/', '');
        }

        return root;
      }
    });

    // Emulate HTTP via _method param
    Backbone.emulateHTTP = true;
    Backbone.emulateJSON = true;

    // Use mongo's _id as the id attr
    Backbone.Model.prototype.idAttribute = '_id';

    // Always hang a ref to the view on this.el
    _.extend(Backbone.View.prototype, {
      initialize: function() {
        this.$el.data('view', this);
        return this;
      }
    });

    window.Datajam         || (Datajam = {});
    Datajam.models         || (Datajam.models = {});
    Datajam.views          || (Datajam.views = {});
    Datajam.collections    || (Datajam.collections = {});
    Datajam.templates      || (Datajam.templates = {});
    // defaults
    Datajam.settings       || (Datajam.settings = {
      'debug': true,
      'interval': 5000
    });
    Datajam.csrf = {
      csrf_param: $('meta[name=csrf-param]').attr('content'),
      csrf_token: $('meta[name=csrf-token]').attr('content')
    };
    // get the real csrf token when it comes via ajax
    $('document').bind('csrfloaded', function(){
      Datajam.csrf.csrf_token = $('meta[name=csrf-token]').attr('content');
    });

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){
  define('datajam/models/event', ['datajam/init'], function(){

    var App = window.Datajam;

    App.models.Event = Backbone.Model.extend({

      url: function(){
        return '/event/' + this.id + '.json';
      },

      save: function(){
        App.debug('Datajam.models.event#save is not implemented.');
      },

      parse: function(data, xhr){
        // pulls out content areas and updates to add to their
        // associated collections (happens on bootstrap).
        if(data.content_areas && data.content_areas.length){
          this.view.contentAreas.add(data.content_areas);
          delete data.content_areas;
        }
        if(data.content_updates && data.content_updates.length){
          this.view.contentUpdates.add(data.content_updates);
          delete data.content_updates;
        }
        return data;
      },

      toJSON: function(options){
        var json = Backbone.Model.prototype.toJSON.call(this, options);
        return _.extend(json, {
          'content_areas': this.view.contentAreas.toJSON()
        });
      }

    });
  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){
  define('datajam/models/content_area', ['datajam/init'], function(){

    var App = window.Datajam;

    App.models.ContentArea = Backbone.Model.extend({});

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){
  define('datajam/models/content_update', ['datajam/init'], function(){

    var App = window.Datajam;

    App.models.ContentUpdate = Backbone.Model.extend({
      // Content Updates post to a non-resourceful url
      save: function() {
        return $.post('/onair/update.json', {
          event_id: App.event.model.id,
          content_area_id: this.get('contentArea').id,
          html: this.get('html')
        });
      }
    });

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){

  var App = window.Datajam;

  define('datajam/collections/content_area', ['datajam/init'], function(){

    App.collections.ContentArea = Backbone.Collection.extend({});

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){

  var App = window.Datajam;

  define('datajam/collections/content_update', ['datajam/init'], function(){

    App.collections.ContentUpdate = Backbone.Collection.extend({

      initialize: function(){
        _.bindAll(this, 'add'
                      , 'comparator'
                      , 'parse'
                      , 'url');
      },

      add: function(models, options){
        Backbone.Collection.prototype.add.call(this, models, options);

        models = _.isArray(models)? models.slice() : [models];
        _.each(models, _.bind(function(model, i, models){
          var area = this.view.contentAreas.get(model.content_area_id);
          if(area &&
             (model.updated_at > area.get('updated_at') || !area.get('updated_at'))
             ){
            area.set({
              html: model.html,
              updated_at: model.updated_at
            });
          }
        }, this));
      },

      comparator: function(a, b){
        if(a.get('updated_at') > b.get('updated_at')) return -1;
        if(a.get('updated_at') < b.get('updated_at')) return 1;
        return 0;
      },

      parse: function(data){
        return data.content_updates || [];
      },

      url: function(){
        return '/event/' + Datajam.event.model.id + '/updates.json';
      }

    });

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){
  define('datajam/views/content_area', ['datajam/init'], function(){

    var App = window.Datajam;

    App.views.ContentArea = Backbone.View.extend({

      initialize: function(){
        _.bindAll(this, 'render');
        this.model.bind('change', this.render, this);

        return this;
      },

      render: function(){
        this.$el.html(this.model.get('html'));

        return this;
      }

    });

  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){

  define('datajam/views/modal', [ 'text!datajam/templates/modal.html',
           'datajam/init',
           'datajam/models/content_update'
         ], function(modalTemplate){

    var App = window.Datajam;

    App.views.Modal = Backbone.View.extend({

      events: {
        'toggle': 'toggle',
        'hide': 'hide',
        'click .modal-update': 'save',
        'click .close': 'hide',
        'keydown': 'handleKeyDown'
      },
      templates: {},

      initialize: function(){
        _.bindAll(this, 'handleKeyDown'
                      , 'hide'
                      , 'render'
                      , 'save'
                      , 'toggle'
                      );

        App.templates['modal'] || (App.templates['modal'] = Handlebars.compile(modalTemplate));

        this.$el.data('modalView', this);
        this.model.bind('change', this.render, this);

        return this;
      },

      handleKeyDown: function(evt){
        if(evt.keyCode == 13 &&
          (evt.metaKey || evt.ctrlKey)){

          evt.preventDefault();
          evt.stopPropagation();
          this.save();
        }
      },

      hide: function(evt){
        try{
          evt.preventDefault();
          evt.stopPropagation();
        }catch(e){}
        this.$el.modal('hide');

        return this;
      },

      render: function(){
        var tmpl = typeof(this.template) === 'function' && this.template || App.templates['modal'];
        this.$el.html(tmpl(this.model.toJSON()));

        return this;
      },

      save: function(evt){
        try{
          evt.preventDefault();
          evt.stopPropagation();
        }catch(e){}

        new App.models.ContentUpdate({
          contentArea: this.model,
          html: this.$el.find('textarea').val()
        }).save()
          .then(_.bind(function(){
            this.hide();
          }, this))
          .fail(_.bind(function(){

          }, this));

        return this;
      },

      toggle: function(evt){
        try{
          evt.preventDefault();
          evt.stopPropagation();
        }catch(e){}

        var visible = this.$el.is(':visible');
        this.$el.modal('toggle');
        if(! visible) this.$el.find('input, select, textarea').eq(0).focus();

        return this;
      }

    });
  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){
  define('datajam/views/event', [ 'text!datajam/templates/onairtoolbar.html',
           'datajam/init',
           'datajam/collections/content_area',
           'datajam/collections/content_update',
           'datajam/models/event',
           'datajam/models/content_area',
           'datajam/models/content_update',
           'datajam/views/content_area',
           'datajam/views/modal'
         ], function(onairToolbarTemplate){

    var App = window.Datajam;

    App.views.Event = Backbone.View.extend({

      events: {
        'click a[data-controls-modal]': 'handleToolbarItemClick'
      },
      templates: {},
      contentAreas: new App.collections.ContentArea(),
      contentUpdates: new App.collections.ContentUpdate(),

      initialize: function(){
        _.bindAll(this, 'authenticate'
                      , 'getSettings'
                      , 'handleKeyDown'
                      , 'handleToolbarItemClick'
                      , 'initializeAreas'
                      , 'initializeModals'
                      , 'initializeReminder'
                      , 'pollForUpdates'
                      , 'pollForAudience'
                      , 'renderToolbar'
                      , 'toggleModal'
                      );

        // set up event model
        this.model = new App.models.Event({ _id: App.eventId });
        this.model.view = this;

        // view bindings to content areas
        this.contentAreas.view = this;
        this.contentUpdates.view = this;

        // window event bindings
        $(window).on('keydown.datajam', this.handleKeyDown);

        $.when(this.model.fetch(), this.getSettings())
          .then(_.bind(function(){
            this.authenticate();
            this.initializeReminder();
            this.initializeAreas();
            this.pollForUpdates();
          }, this));

        return this;
      },

      authenticate: function(){
        var xhr = $.getJSON('/onair/signed_in.json', _.bind(function(data){
          if(data){
            if(data.csrfToken){
              $('meta[name="csrf-token"]').attr('content', data.csrfToken);
              $(document).trigger('csrfloaded');
            }
            if(data.signedIn === true){
              this.initializeModals();
              this.renderToolbar();
              this.pollForAudience();
            }
          }
        }, this));

        // return the xhr promise for callback chaining
        return xhr;
      },

      getSettings: function(){
        return $.getJSON('/settings.json', function(data){
          data && data.length && _.each(data, function(setting, i, data){
            App.settings[setting.name] = setting.value;
          });
        });
      },

      handleKeyDown: function(evt){
        if(evt.keyCode >= 49 && evt.keyCode <= 57 && evt.ctrlKey){
          try{
            this.toggleModal('#modal-' + this.contentAreas.models[evt.keyCode - 49].id);
          }catch(e){}
        }
      },

      handleToolbarItemClick: function(evt){
        evt.preventDefault();
        evt.stopPropagation();
        this.toggleModal('#' + $(evt.target).attr('data-controls-modal'));

        return this;
      },

      initializeAreas: function(){
        _.each(this.contentAreas.models, _.bind(function(area, i, areas){
          area.view = new App.views.ContentArea({
            el: $('#' + area.get('area_type') + '_' + area.id),
            model: area,
            collection: areas
          }).render();
        }, this));

        return this;
      },

      initializeModals: function(){
        _.each(this.contentAreas.models, _.bind(function(area, i, areas){
          var modal_class = area.get('modal_class');
          // require() the modal appropriate view class, then init
          require([_.pathify(modal_class)], _.bind(function(){
            var klass = _.constantize(modal_class);
            area.modal = new klass({
              el: $('<div id="modal-' + area.id + '" class="modal hide fade" style="display: none;">'),
              model: area
            });
            $('body').append(area.modal.el);
            area.modal.render();
            area.modal.$el.modal({
              backdrop: false,
              show: false
            });
          }, this));
        }, this));

        return this;
      },

      initializeReminder: function(){
        var eventTime = this.model.get('unix_scheduled_at'),
            currentTime = new Date().getTime()/1000;

        if(eventTime > currentTime){
          $('#event_reminder').show();
          $("#event_reminder form").on('ajax:success', function(event, data, status, xhr) {
            $(this).find('.response')
                   .text(data.message)
                   .attr({ 'class': 'response alert alert-' + data.type })
                   .fadeIn()
                   .delay(5000)
                   .fadeOut();
            $(this).find("input[name=email]").val('');
          });
        }
      },

      pollForUpdates: function(){
        this.contentUpdates.fetch({add: true});
        setTimeout(_.bind(this.pollForUpdates, this), App.settings.interval);

        return this;
      },

      pollForAudience: function(){
        if(! App.settings.chartbeat_api_key){
          this.$el.find('li.audience').hide();
          return this;
        }

        var url = '//api.chartbeat.com/live/quickstats/v3/';
        $.ajax({
          url: url,
          dataType: 'jsonp',
          jsonp: 'jsonp',
          callback: '?',
          data: {
            apikey: App.settings.chartbeat_api_key,
            host: location.hostname.replace(/^www\./, ''),
            path: location.pathname
          }
        }).then(_.bind(function(data){
          this.$el.find('li.audience .badge').html(data.people);
        }, this));
        setTimeout(_.bind(this.pollForAudience, this), 30000);

        return this;
      },

      remove: function() {
        // unbind keypress handler
        $(window).off('keydown.datajam');
        // TODO: remove dependent stuff
        BackboneView.prototype.remove.call(this);
      },

      renderToolbar: function() {
        // draw the onair toolbar
        App.templates['onairToolbar'] || (App.templates['onairToolbar'] = Handlebars.compile(onairToolbarTemplate));
        this.$el.html(
          App.templates['onairToolbar'](this.model.toJSON())
        );
        $('body').addClass('topbarred');

        return this;
      },

      toggleModal: function(id) {
        $('div.modal[id^=modal]').not('#' + id).trigger('hide');
        $(id).trigger('toggle');

        return this;
      }

    });
  });

})(define, require, jQuery, window);
/*jshint laxcomma:true, expr:true, evil:true */
(function(define, require, $, window, undefined){

  require(['datajam/init', 'datajam/views/event'], function(){
    var el = $('body').prepend('<div class="datajam-event" />').find('.datajam-event');
    Datajam.event = new Datajam.views.Event({ el: el });
  });

})(define, require, jQuery, window);
})(jQuery, define, require);
