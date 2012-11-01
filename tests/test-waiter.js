var assert = chai.assert;


describe('jquery.waiter - high level', function() {
  /**
   * Delays function by short time
   */
  function shortDelay(callback) {
    setTimeout(callback, 0.1);
  }
  
  /**
   * Medium delay function by short time
   */
  function mediumDelay(callback) {
    setTimeout(callback, 10);
  }

  /**
   * Quick assert for div matching
   */
  function matchIsElement(matches, tag, id) {
    assert.lengthOf(matches, 1);
    var match = matches[0];
    assert.equal(match.tagName.toLowerCase(), tag);
    assert.equal(match.id, id);
  }

  var testArea = null;
  var testAreaContainer = null;

  before(function() {
    testAreaContainer = $('<div id="testContainer"></div>');
    testAreaContainer.appendTo(document.body);
  });

  beforeEach(function() {
    testArea = $('<div></div>');
    testArea.appendTo(testAreaContainer);
  });

  afterEach(function() {
    testAreaContainer.empty();
  });

  after(function() {
    testAreaContainer.remove();
  });

  describe("waiter('on', ...)", function() {
    it('detects a new div in testArea', function(done) {
      testArea.waiter('on', 'div', function(matches) {
        matchIsElement(matches, 'div', 'test1');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test1"></div>');
      });
    });

    it('detects div#test2 appended in testArea', function(done) {
      testArea.waiter('on', 'div#test2', function(matches) {
        matchIsElement(matches, 'div', 'test2');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test2"></div>');
      });
    });

    it('detects div#test3 already in the testArea', function(done) {
      testArea.append('<div id="test3"></div>');
      testArea.waiter('on', 'div#test3', function(matches) {
        matchIsElement(matches, 'div', 'test3');
        done();
      });
    });

    it('detects multiple divs added in the testArea', function(done) {
      testArea.waiter('on', 'div', function(matches) {
        assert.lengthOf(matches, 3);
        done();
      });
      shortDelay(function() {
        testArea.append('<div><div></div><div></div></div>');
      });
    });

    it('detects div added with innerHTML', function(done) {
      testArea.waiter('on', 'div', function(matches) {
        matchIsElement(matches, 'div', 'test5');
        done();
      });
      shortDelay(function() {
        var rawTestAreaEl = testArea[0];
        rawTestAreaEl.innerHTML = '<div id="test5"></div>';
      });
    });

    it('detects continuously', function(done) {
      var counter = 5
      testArea.waiter('on', 'div', { continuous: true }, function(matches) {
        counter -= 1;
        if(counter == 0) {
          done();
        }
      });

      var timeoutId;
      var timeoutFunc = function() {
        testArea.append('<div></div>');
        if(counter > 1) {
          timeoutId = setTimeout(timeoutFunc, 0.5);
        }
      };
      timeoutFunc();
    });
  });

  describe("waiter('off', ...)", function() {
    var waiterCalls = 0;
    beforeEach(function() {
      waiterCalls = 0;
    });
    
    function callback() {
      waiterCalls += 1;
    };

    function simpleWaiter(selector) {
      selector = selector || 'div';
      testArea.waiter('on', selector, callback);
    }

    it('turns off a waiter that never runs', function() {
      simpleWaiter('div');
      testArea.waiter('off', 'div', callback);
      assert.equal(waiterCalls, 0);
    });

    it('attempts to turn off a waiter after it is called', function(done) {
      simpleWaiter('div');
      shortDelay(function() {
        testArea.append('<div></div>');
        shortDelay(function() {
          testArea.waiter('off', 'div', callback);
          assert.equal(waiterCalls, 1);
          done();
        });
      });
    });
    
    it('turns off a continuous waiter', function(done) {
      testArea.waiter('on', 'span', { continuous: true }, callback);
      
      var counter = 0;

      var finish = function() {
        testArea.waiter('off', 'span', callback);
        assert.equal(waiterCalls, 5);
        testArea.append('<span></span>');
        shortDelay(function() {
          assert.equal(waiterCalls, 5);
          done();
        });
      };

      var timeoutId;
      var timeoutFunc = function() {
        testArea.append('<span></span>');
        counter += 1
        if(counter < 5) {
          timeoutId = setTimeout(timeoutFunc, 0.5);
        } else {
          timeoutId = setTimeout(finish, 0.5);
        }
      };
      timeoutFunc();
    });

  });
});
