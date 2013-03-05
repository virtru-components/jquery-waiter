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
    includeAdded: true,
    includeRemoved: false,
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

    var parentElement = this;
    preliminaryMatch = function() {
      var matches = parentElement.find(selector);
      if(matches.length > 0) {
        callback.apply(null, [matches]);
        return true;
      }
      return false;
    };
    var filter = function(nodes) {
      return nodes;
    };
    var preliminaryMatch = function() { return false; };
    if(selector !== null) {
      preliminaryMatch = function() {
        var matches = parentElement.find(selector);
        if(matches.length > 0) {
          callback.apply(null, [matches]);
          return true;
        }
        return false;
      };
      if(typeof selector === 'function' || options.includeRemoved) {
        // Skip the preliminary match if the selector is a function
        preliminaryMatch = function() { return false; };
      }
      var inclusiveSelector = selector + ', :has(' + selector + ')';
      filter = function(nodes) {
        return $(nodes).filter(inclusiveSelector);
      }
    }
    observer = new MutationObserver(function(records) {
      var addedMatches = [];
      var removedMatches = [];
      records.forEach(function(record) {
        if(record.addedNodes) {
          var currentMatches = filter(record.addedNodes);
          addedMatches.push.apply(addedMatches, currentMatches);
        }
        if(record.removedNodes) {
          var currentMatches = filter(record.removedNodes);
          removedMatches.push.apply(removedMatches, currentMatches);
        }
      });
      var hasRemoved = removedMatches.length > 0 && options.includeRemoved;
      var hasAdded = addedMatches.length > 0 && options.includeAdded;
      if(hasAdded || hasRemoved) {
        callback.apply(null, [addedMatches, removedMatches]);
        if(!options.continuous) {
          stopWaiting();
        }
      }
    });
    if(preliminaryMatch()) {
      if(!options.continuous) {
        return;
      }
    }
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

  function AsyncWaitConfigError(msg) {
    this.message = msg;
    this.name = 'AsyncWaitConfigError';
    $.extend(new Error(msg), this);
  }

  function waitAsync(selector, userOptions) {
    var deferred = Q.defer();
    userOptions = userOptions || {};
    if(userOptions.continuous === true) {
      throw new Error('Cannot wait continously using promises');
    }
    var args = [selector, userOptions, function(matches) {
      deferred.resolve(matches);
    }];
    waitOn.apply(this, args);
    return deferred.promise;
  }

  var methods = {
    on: waitOn,
    off: waitOff,
    async: waitAsync
  };

  $.fn.wait = function(methodName) {
    var method = methods[methodName];
    if(!method) {
      throw new Error('wait method "'+ methodName +'" does not exist');
    }
    var methodArgs = [].splice.apply(arguments, [1]);
    return method.apply(this, methodArgs);
  };

  if(DEBUG) {
    $testable.WaiterMap = WaiterMap;
  }
})(jQuery);
