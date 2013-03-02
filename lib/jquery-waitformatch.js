if(typeof DEBUG === 'undefined') {
  DEBUG = true;
}

if(DEBUG) {
  var $testable = {};
}

(function($) {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

  var Dict = $dict.Dict;

  var WaiterMap = function() {
    this.map = {};
  };

  /**
   * Get all callbacks for a selector
   */
  WaiterMap.prototype.all = function(selector) {
    return this.map[selector];
  };

  WaiterMap.prototype.get = function(selector, callback) {
    var selectorDict = this.map[selector];
    if(selectorDict) {
      return selectorDict.get(callback);
    }
  };

  WaiterMap.prototype.add = function(selector, callback, stopWaiting) {
    var selectorDict = this.map[selector] || new Dict();
    selectorDict.set(callback, stopWaiting);
    this.map[selector] = selectorDict;
  };

  WaiterMap.prototype.remove = function(selector, callback, handler) {
    handler = handler || function() {};
    var selectorDict = this.map[selector];
    if(selectorDict) {
      var stopWaiting = selectorDict.pop(callback);
      if(stopWaiting) {
        handler.apply(null, [stopWaiting]);
      }
    }
  };

  WaiterMap.prototype.removeAll = function(selector, handler) {
    handler = handler || function() {};
    var selectorDict = this.map[selector];
    if(selectorDict) {
      while(selectorDict.length() > 0) {
        var popped = selectorDict.popitem();
        var stopWaiting = popped[1];
        handler.apply(null, [stopWaiting]);
      }
    }
  };


  var defaultWaiterOnOptions = {
    includeChildren: true,
    timeout: 0,
    timedOut: function() {},
    observerOptions: {
      attributes: false,
      subtree: true,
      childList: true
    },
    continuous: false
  };

  function waitOn(selector) {
    var callback = arguments[1];
    var timeoutID = null;
    var observer = null;
    var waits = null;
    var userOptions = {};
    if(arguments.length >= 3) {
      userOptions = arguments[1];
      callback = arguments[2];
    }
    var options = $.extend({}, defaultWaiterOnOptions, userOptions);

    var stopWaiting = function() {
      if(timeoutID) {
        clearTimeout(timeoutID);
      }
      if(observer) {
        observer.disconnect();
      }
      waits.remove(selector, callback);
    };

    var matches = this.find(selector);
    if(matches.length > 0) {
      callback.apply(null, [matches]);
      if(!options.continuous) {
        return this;
      }
    }
    var parentElement = this;
    var preliminaryMatch = function() {
      var matches = parentElement.find(selector);
      if(matches.length > 0) {
        callback.apply(null, [matches]);
        if(!options.continuous) {
          stopWaiting();
        }
      }
      return true;
    };
    if(typeof selector === 'function') {
      // Skip the preliminary match if the selector is a function
      preliminaryMatch = function() {};
    }
    observer = new MutationObserver(function(records) {
      if(preliminaryMatch()) {
        return;
      }
      records.forEach(function(record) {
        if(record.addedNodes) {
          $.each(record.addedNodes, function(index, newNode) {
            newNode = $(newNode);
            if(newNode.is(selector)) {
              callback.apply(null, [newNode]);
              if(!options.continuous) {
                stopWaiting();
              }
            }
          });
        }
      });
    });
    this.each(function() {
      observer.observe(this, {
        subtree: true,
        childList: true
      });
    });
    waits = this.data('stopWaiters') || new WaiterMap();
    waits.add(selector, callback, stopWaiting);

    this.data('stopWaiters', waits);
    // If there is a timeout
    if(options.timeout > 0) {
      timeoutID = setTimeout(function() {
        stopWaiting();
        options.timedOut.apply(null);
      }, options.timeout)
    }
    return this;
  };

  function waitOff(selector, callback) {
    var waits = this.data('stopWaiters')
    if(waits) {
      if(callback) {
        waits.remove(selector, callback, function(stopWaiting) {
          stopWaiting.apply(null);
        });
      } else {
        waits.removeAll(selector, function(stopWaiting) {
          stopWaiting.apply(null);
        });
      }
    }
  };
  
  var methods = {
    on: waitOn,
    off: waitOff
  };

  $.fn.wait = function(methodName) {
    var method = methods[methodName];
    if(!method) {
      throw new Error('wait method "'+ methodName +'" does not exist');
    }
    var methodArgs = [].splice.apply(arguments, [1]);
    method.apply(this, methodArgs);
  };

  if(DEBUG) {
    $testable.WaiterMap = WaiterMap;
  }
})(jQuery);
