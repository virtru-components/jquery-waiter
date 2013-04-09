/**
 * A mutation observer shim for finding new elements. Only works on new
 * elements.
 */
var $ = require('jquery');

var processedClass = 'mopc-' + Math.floor(Math.random()*100000);
var TIMEOUT = 100; // Check for new every 100 ms

function CompatMutationObserver(callback) {
  this._callback = callback;
  this._observerTimeout = null;
}

CompatMutationObserver.prototype.observe = function(el, options) {
  var callback = this._callback;
  var self = this;
  function findMatches() {
    var matches = $(el).find(':not(.' + processedClass + ')');
    matches.addClass(processedClass);
    var rawMatches = matches.get();
    callback(new Records(rawMatches));
    self._observerTimeout = setTimeout(findMatches, TIMEOUT);
  }
  // Do an initial match
  findMatches();
}

CompatMutationObserver.prototype.disconnect = function() {
  clearTimeout(this._observerTimeout);
}

/**
 * A shim for the records
 */
function Records(matches) {
  this._matches = matches;
}

Records.prototype.forEach = function(callback) {
  callback({ addedNodes: this._matches });
}

module.exports = CompatMutationObserver;
