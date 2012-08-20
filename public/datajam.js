Datajam = (typeof Datajam == "undefined") ? {} : Datajam;

Datajam.modalRenderers = {};

Datajam.Event = Backbone.Model.extend({
  id: Datajam.eventId,
  url: '/event/' + Datajam.eventId + '.json'
});

Datajam.Check = Backbone.Model.extend({
  url: '/onair/signed_in'
});

Datajam.ContentArea = Backbone.Model.extend({

});

Datajam.ContentUpdate = Backbone.Model.extend({
  save: function() {
    var contentArea = this.get('contentArea');
    var payload = { event_id: Datajam.event.get('_id'),
                    content_area_id: contentArea.get('_id'),
                    html: $('#textarea-' + contentArea.get('_id')).val() };
    $.post('/onair/update', payload, function(response) {
      $('#modal-' + contentArea.get('_id')).modal('hide');
    }, 'json');
  }
});

Datajam.OnairToolbar = Backbone.View.extend({
  render: function() {
    var topbarTemplate = Handlebars.compile($("script#onair_topbar_template").html());
    $('body').prepend(topbarTemplate(this.model.toJSON()));
    $('body').addClass('topbarred');
    return this;
  }
});

Datajam.ContentAreaView = Backbone.View.extend({
  render: function() {
    $('#content_area_' + this.model.get('_id')).html(this.model.get('html'));
    this.renderModal()
  },

  renderModal: function() {
    contentArea = this.model;
    contentAreaType = contentArea.get('area_type');

    renderer = Datajam.modalRenderers[contentAreaType]

    if (!!renderer) {
      renderer(contentArea)
    } else {
      var contentUpdate = new Datajam.ContentUpdate({contentArea: contentArea});
      var modal = new Datajam.ContentUpdateModal({ model: contentUpdate,
                                                   id: contentArea.get('_id') });
      modal.render();
    }
  }
});

Datajam.Modal = Backbone.View.extend({
  events: {
    'click .modal-update': 'save'
  },
  render: function() {
    var tmpl = this.template()

    // Assign to this.el and add to body.
    this.el = $(tmpl(this.model.get('contentArea').toJSON()));
    $('body').append(this.el);

    // Rebind events since this.el was assigned.
    this.delegateEvents();

    return this;
  },
  save: function(e) {
    e.preventDefault();
    this.model.save();
  }
})

Datajam.ContentUpdateModal = Datajam.Modal.extend({
  template: function() {
    return Datajam.ModalTemplates[this.model.get('contentArea').get('area_type')];
  }
});

Datajam.notificationBox = function() {
  var eventReminder = $("#event_reminder");
  var scheduledTime = Datajam.event.get("unix_scheduled_at");
  var currentTime = new Date().getTime()/1000;
  var hideNotificationBox = (scheduledTime - currentTime) <= 0;

  if(hideNotificationBox && eventReminder.is(":visible")) {
    eventReminder.hide();
  }
};

Datajam.pollForUpdates = function() {
  Datajam.notificationBox();
  $.getJSON('/event/' + Datajam.eventId + '/updates.json', function(updates) {

    if (updates['content_updates'] && updates['content_updates'].length > 0) {

      if (! Datajam.updates.length) {

        // Add all updates, display them
        _.each(updates['content_updates'], function(contentUpdate) {
          $('#content_area_' + contentUpdate['content_area_id']).html(contentUpdate['html']);
          Datajam.updates.push(contentUpdate);
        });

      }else{

        // Otherwise, only update the DOM if there are new updates.
        var lastUpdate = Datajam.updates[Datajam.updates.length - 1];
        if (lastUpdate) {
          _.each(updates['content_updates'], function(contentUpdate) {
            if (contentUpdate['updated_at'] > lastUpdate['updated_at']) {
              $('#content_area_' + contentUpdate['content_area_id']).html(contentUpdate['html']);
              Datajam.updates.push(contentUpdate);
            }
          });
        }
      }
    }
    setTimeout(function() { Datajam.pollForUpdates(); }, 3000);
  });
};

$(function() {

  // Compile the modal template(s).
  var tmpls = {};
  $("script.modalTemplate").each(function(){
    var tmpl = $(this)
      , areaType = tmpl.attr('id').replace('_modal_template', '');
    tmpls[areaType] = Handlebars.compile(tmpl.html());
  });

  $("#remind_event").bind('ajax:success', function(event, data, status, xhr) {
    $("#notification_response").text(data.message).attr({ class: 'alert alert-' + data.type });
    $(this).find("input[name=email]").val('');
  });

  Datajam.ModalTemplates = tmpls;

  if (Datajam.eventId) {
    var event = new Datajam.Event();
    Datajam.event = event;
    event.fetch({
      success: function(model, response) {

        // Check that the viewer signed in.
        var check = new Datajam.Check();
        check.fetch({
          success: function(model,response) {

            if (check.get('csrfToken')) {
              $('meta[name=csrf-token]').attr('content', check.get('csrfToken'));
              $(document).trigger('csrfloaded');
            }

            if (check.get('signedIn')) {

              // Build the ON AIR toolbar.
              var toolbarView = new Datajam.OnairToolbar({ model: event });
              toolbarView.render();

              // Build the modals for each content area.
              $.each(event.get('content_areas'), function(i, contentAreaJSON) {
                var contentArea = new Datajam.ContentArea(contentAreaJSON);
                var contentAreaView = new Datajam.ContentAreaView({ model: contentArea });
                contentAreaView.render();
              });

            }
          }
        });

        Datajam.updates = [];
        Datajam.pollForUpdates();
      }
    });
  }

});

