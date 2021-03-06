(function() {
  // namespace
  window.Fruum = window.Fruum || {};

  // load script
  function load_script(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    // IE
    if (script.readyState) {
      script.onreadystatechange = function() {
        if (script.readyState === 'loaded' || script.readyState === 'complete') {
          script.onreadystatechange = null;
          if (callback) callback();
        }
      };
    } else {
      script.onload = function() {
        if (callback) callback();
      };
      script.onerror = function() {
        if (callback) callback();
      };
    }
    script.src = url;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
  }

  // on document ready
  function ready(fn) {
    if (document.readyState != 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  // helpers
  function normalizeUrl(url) {
    url = url || '';
    if (url.length && url[url.length - 1] !== '/') {
      url += '/';
    }
    return url;
  }

  function is_fruum_link(node) {
    if (!node || !node.getAttribute) return;
    var href = node.getAttribute('href');
    if (href && href.indexOf('#fruum:') == 0) {
      return href.replace('#fruum:', '');
    }
  }

  function is_fruum_attr(node) {
    if (!node || !node.getAttribute) return;
    return node.getAttribute('fruum-link');
  }

  function remove_class(el, className) {
    if (!el) return;
    if (el.classList) {
      el.classList.remove(className);
    } else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  function add_class(el, className) {
    if (!el) return;
    if (el.classList) {
      el.classList.add(className);
    } else {
      el.className += ' ' + className;
    }
  }

  function has_class(el, className) {
    if (!el) return false;
    if (el.classList) {
      return el.classList.contains(className);
    } else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
  }

  function outer_height(el) {
    var height = el.offsetHeight;
    var style = getComputedStyle(el);

    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    return height;
  }

  function bind_event(selector, event, fn) {
    var elements = document.querySelectorAll(selector);
    Array.prototype.forEach.call(elements, function(el, i) {
      el.addEventListener(event, fn);
    });
  }

  // initialize loader on document ready
  ready(function() {
    // loader html (replaced by server)
    var preview_html = '__html__';

    window.fruumSettings = window.fruumSettings || {};
    // replaced by server
    window.fruumSettings.app_id = '__app_id__';
    window.fruumSettings.fullpage_url = normalizeUrl('__fullpage_url__');
    window.fruumSettings.pushstate = Boolean(parseInt('__pushstate__'));
    window.fruumSettings.sso = Boolean(parseInt('__sso__'));

    // force fullpage
    if (window.fruumSettings.container && window.fruumSettings.fullpage == undefined) {
      window.fruumSettings.fullpage = true;
    }
    // force history
    if (window.fruumSettings.fullpage && window.fruumSettings.history == undefined) {
      window.fruumSettings.history = true;
    }
    // force restore
    if (window.fruumSettings.history && window.fruumSettings.restore == undefined) {
      window.fruumSettings.restore = true;
    }

    // add css
    (function() {
      // this is replaced by server
      var css = '__css__';
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
    })();

    // add html
    (function() {
      // this is replaced by server
      var div = document.createElement('div');
      div.innerHTML = preview_html;
      var frag = document.createDocumentFragment();
      var child;
      while (child = div.firstChild) { // eslint-disable-line
        frag.appendChild(child);
      }
      var parent;
      if (window.fruumSettings.container) {
        parent = document.querySelectorAll(window.fruumSettings.container)[0];
      } else {
        parent = (document.body || document.getElementsByTagName('body')[0]);
      }
      if (parent) parent.appendChild(frag);
    })();

    var el_preview = document.getElementById('fruum-preview');
    var loaded = false;

    function resize_loader(el) {
      if (!el) return;

      var el_varying = el_preview.querySelector('.fruum-js-varying'),
          el_fixed = el_preview.querySelectorAll('.fruum-js-fixed'),
          el_varying_style = getComputedStyle(el_varying);

      var fixed_height = 0;
      for (var i = 0; i < el_fixed.length; ++i) {
        fixed_height += outer_height(el_fixed[i]);
      }
      el_varying.style.height = (
        outer_height(el) - fixed_height -
        parseInt(el_varying_style.marginTop) -
        parseInt(el_varying_style.marginBottom)
      ) + 'px';
    }
    setTimeout(function() {
      resize_loader(el_preview);
    }, 0);

    function launch_fruum() {
      if (!loaded) {
        loaded = true;
        resize_loader(el_preview);
        if (window.fruumSettings.container) {
          add_class(el_preview, 'fruum-fullpage');
        } else {
          add_class(el_preview, 'fruum-clicked');
        }
        // this is replaced by server
        window.fruumSettings.fruum_host = '__url__';

        // check for bot in fullpage mode
        if (window.fruumSettings.container &&
            window.fruumSettings.fullpage_url &&
            /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)
        ) {
          // load static HTML
          var request = new XMLHttpRequest(),
              docid = window.fruumSettings.view_id;
          request.open('GET',
            window.fruumSettings.fruum_host +
            '/_/robot/' + window.fruumSettings.app_id +
            (docid ? '/v/' + docid : ''), true);

          request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
              var el = document.querySelectorAll(window.fruumSettings.container)[0];
              el.innerHTML = request.responseText;
            }
          };
          request.send();
        } else {
          // append fruum
          load_script(window.fruumSettings.fruum_host +
            '/_/get/js/' + window.fruumSettings.app_id);
        }
      }
    }

    // expose launcher
    window.Fruum.launch = function(doc_id) {
      if (window.Fruum.api) {
        window.Fruum.api.open(doc_id);
      } else {
        window.fruumSettings.view_id = doc_id;
        launch_fruum();
      }
    };

    function process_click(event, link) {
      if (link) {
        event && event.preventDefault();
        window.Fruum.launch(link);
      }
    }
    function process_mouseover(event, link) {
      if (link) {
        var el = document.getElementById('fruum');
        if (el && !has_class(el, 'fruum-hide')) return;
        resize_loader(el_preview);
        add_class(el_preview, 'fruum-peak');
      }
    }
    function process_mouseout(event, link) {
      if (link) {
        remove_class(el_preview, 'fruum-peak');
      }
    }
    function detectViewID() {
      var viewid = '';
      if (window.location.hash &&
          window.location.hash.indexOf('#v/') == 0 &&
          window.fruumSettings.history &&
          !window.fruumSettings.pushstate
      ) {
        viewid = window.location.hash.replace('#v/', '');
      } else if (window.fruumSettings.pushstate &&
               window.fruumSettings.fullpage_url &&
               window.fruumSettings.history &&
               window.location.href.indexOf(window.fruumSettings.fullpage_url + 'v/') == 0
      ) {
        viewid = window.location.href.replace(
          window.fruumSettings.fullpage_url + 'v/', ''
        );
      }
      return {
        id: viewid.split('/')[0],
        jumpto: viewid.split('/')[1],
      };
    }

    // bind event
    bind_event('a[href]', 'click', function(e) {
      process_click(e, is_fruum_link(this));
    });
    bind_event('[fruum-link]', 'click', function(e) {
      process_click(e, is_fruum_attr(this));
    });
    if (!window.fruumSettings.fullpage) {
      bind_event('a[href]', 'mouseover', function(e) {
        process_mouseover(e, is_fruum_link(this));
      });
      bind_event('a[href]', 'mouseout', function(e) {
        process_mouseout(e, is_fruum_link(this));
      });
      bind_event('[fruum-link]', 'mouseover', function(e) {
        process_mouseover(e, is_fruum_attr(this));
      });
      bind_event('[fruum-link]', 'mouseout', function(e) {
        process_mouseout(e, is_fruum_attr(this));
      });

      // check for fruum hastag on url
      if (window.fruumSettings.restore) {
        var detect_view = detectViewID();
        window.fruumSettings.view_id = detect_view.id;
        window.fruumSettings.jumpto = detect_view.jumpto;
        if (window.fruumSettings.view_id) {
          launch_fruum();
        } else if (window.sessionStorage && window.sessionStorage.getItem) {
          // check session storage
          try {
            if (window.sessionStorage.getItem('fruum:open:' + window.fruumSettings.app_id) | 0) {
              launch_fruum();
            }
          } catch (err) {}
        }
      }
    } else {
      var detect_view = detectViewID(); // eslint-disable-line
      window.fruumSettings.view_id = detect_view.id;
      window.fruumSettings.jumpto = detect_view.jumpto;
      launch_fruum();
    }
  });
})();
