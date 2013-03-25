var Dict = require('dict').Dict;

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

exports.WaiterMap = WaiterMap;
