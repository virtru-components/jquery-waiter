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

  describe('#remove', function() {
    var map;
    var callback;

    var testCallback = function(selector, func) {
      callback.apply(null, arguments);
    };

    beforeEach(function() {
      map = new WaiterMap();
      map.add('div', f1, _.bind(testCallback, null, 'div', f1));
      map.add('div', f2, _.bind(testCallback, null, 'div', f2));
      map.add('div', f3, _.bind(testCallback, null, 'div', f3));
      map.add('somename', f1, _.bind(testCallback, null, ['somename', f1]));
      map.add('a different name', f1, 
              _.bind(testCallback, null, ['a different name', f1]));
    });

    it('should remove a callback', function(done) {
      callback = function() {
        assert.isUndefined(map.get('div', f1));
        assert.isDefined(map.get('div', f2));
        done();
      };
      map.remove('div', f1, function(stopWaiting) {
        stopWaiting();
      });
    });

    it('should remove multiple callbacks', function(done) {
      var counter = 5;
      callback = function() {
        counter -= 1;
        if(counter == 0) {
          assert.isUndefined(map.get('div', f1));
          assert.isUndefined(map.get('div', f2));
          assert.isUndefined(map.get('div', f3));
          assert.isUndefined(map.get('somename', f1));
          assert.isUndefined(map.get('a different name', f1));
          done();
        }
      };
      var stopWaiter = function(stopWaiting) {
        stopWaiting();
      };
      map.remove('div', f1, stopWaiter);
      map.remove('div', f2, stopWaiter);
      map.remove('div', f3, stopWaiter);
      map.remove('somename', f1, stopWaiter);
      map.remove('a different name', f1, stopWaiter);
    });
  });

  describe('#removeAll', function() {
    var map;
    var callbackCount = 0;

    var testCallback = function(selector, func) {
      callbackCount += 1;
    };

    beforeEach(function() {
      callbackCount = 0;
      map = new WaiterMap();
      map.add('div', f1, _.bind(testCallback, null, 'div', f1));
      map.add('div', f2, _.bind(testCallback, null, 'div', f2));
      map.add('div', f3, _.bind(testCallback, null, 'div', f3));
      map.add('somename', f1, _.bind(testCallback, null, ['somename', f1]));
      map.add('a different name', f1, 
              _.bind(testCallback, null, ['a different name', f1]));
    });

    it('should remove all of the callbacks', function() {
      map.removeAll('div', function(stopWaiting) {
        stopWaiting();
      });
      assert.equal(callbackCount, 3);
      assert.isDefined(map.get('somename', f1));
    });
  });
});
