(function($){
  $(function(){
    // toggle 'new' form if list is empty
    $('.tab-pane.active .empty').each(function(){
      var href = $(this).parents('.tab-pane').attr('id');
      $('a[href=#' + href + ']').parents('li').next('li').find('a').tab('show');
    });

    // Infinite Scrolling for tables
    var InfiniteScrolling = function() {
      this.pageNumber = 1;
      this.table = $('#table-main.ajax-table');

      this.nextPage = function() {
        var basePath = location.origin + location.pathname;

        var searchPage = location.search.match(/page=([0-9])/);
        var currentPage = searchPage ? searchPage[1] : false;

        var queryString = location.search.replace(/(page=)([0-9])/, function(string, query, page) {
          return query + (parseInt(currentPage) + 1);
        });

        if(!currentPage) {
          currentPage = this.pageNumber;
          var pageString = (location.search.length ? "&" : "?") + "page=" + (currentPage + 1);

          queryString = location.search + pageString;
          this.pageNumber = currentPage + 1;
        }

        return basePath + queryString;
      };

      this.currentViewportAt = function() {
        return $(window).scrollTop() + $(window).height();
      };

      this.tableEndsAt = function() {
        return this.table.position().top + this.table.height();
      };

    };

    InfiniteScrolling.prototype = {

      checkAndLoadMore: function() {
        if(this.table.size() < 1) return;
        if(this.currentViewportAt() - this.tableEndsAt() >= 50) {
          $.ajax({
            url: this.nextPage(),
            success: function(data, xhr) {
              var newContent = $(data).find('tbody tr');
              var table = $('#table-main.ajax-table table tbody');

              if(newContent.size()) table.append(newContent);
            }
          });
        }
      }

    };

    var scroller = new InfiniteScrolling;
    scroller.checkAndLoadMore();

    $(window).scroll(function() {
      scroller.checkAndLoadMore();
    }); //End Infinite Scrolling

  });

  $(window).load(function(){

    function createEditorContainer(element) {
      var container = $("<div/>");
      container.attr("id", "editor-" + element.attr("id"));
      container.addClass("ace-editor");
      element.after(container)
      return container;
    }

    $("textarea.datajamTemplate").each(function() {
      var $el = $(this),
          container = createEditorContainer($el);

      // init hidden editors off-screen so they work
      if(container.is(':hidden')){
        container.wrap('<div id="' + container.attr('id') + '_wrap" class="ace-editor-replaceme"></div>');
        $('body').append(container.css({
          'position': 'absolute',
          'left': '-9999px'
        }).remove());
      };

      var editor = ace.edit(container.attr("id")),
          HtmlMode = require("ace/mode/html").Mode,
          editorSession = editor.getSession();

      $el.hide();
      editorSession.setMode(new HtmlMode());
      editorSession.setValue($el.val());
      editorSession.setTabSize(2);
      editorSession.setUseSoftTabs(true);
      editorSession.on('change', function() {
        $el.val(editorSession.getValue());
      });
      editor.setShowPrintMargin(false);
    });
    // reset off-screen editors
    $('.ace-editor-replaceme').each(function(){
      var $el = $('#' + $(this).attr('id').replace('_wrap', ''));
      $(this).append($el.css({
        'position': 'static',
        'left': 0
      }).remove());
      $el.unwrap();
    });
  });
})(jQuery);
