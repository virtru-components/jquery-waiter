var assert = chai.assert;

describe('WaiterMap - internal class', function() {
  var WaiterMap = $testable.WaiterMap;
  var f1 = function() {};
  var f2 = _.bind(f1, {});
  var f3 = _.bind(function() {}, {});

  describe('constructor', function() {
    it('should work', function() {
      var map = new WaiterMap();
    });
  });

  describe('#add and #get', function() {
    var map;
    beforeEach(function() {
      map = new WaiterMap();
    });

    it('should insert a callback', function() {
      var callback = function() {};
      map.add('div', f1, callback);
      var retrievedCallback = map.get('div', f1);
      assert.equal(retrievedCallback, callback);
    });
    
    it('should insert a callback to a bound function', function() {
      var callback = function() {};
      map.add('div', f2, callback);
      var retrievedCallback = map.get('div', f2);
      assert.equal(retrievedCallback, callback);
    });

    it('should insert multiple callbacks for a selector', function() {
      var callback1 = function() {};
      var callback2 = function() {};
      map.add('div', f1, callback1);
      map.add('div', f2, callback2);

      assert.equal(map.get('div', f1), callback1);
      assert.equal(map.get('div', f2), callback2);
    });

    it('should insert a callback for 2 different selectors', function() {
      var callback1 = function() {};
      var callback2 = function() {};
      map.add('div', f1, callback1);
      map.add('span', f2, callback2);

      assert.equal(map.get('div', f1), callback1);
      assert.equal(map.get('span', f2), callback2);
    });
  });
});
