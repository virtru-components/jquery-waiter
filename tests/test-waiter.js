var assert = require('chai').assert,
    waiter = require('../lib/jquery-waiter'),
    $ = require('jquery');

describe('jquery.wait - high level', function() {
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

  describe("wait('on', ...)", function() {
    it('detects a new div in testArea', function(done) {
      testArea.wait('on', 'div', function(matches) {
        matchIsElement(matches, 'div', 'test1');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test1"></div>');
      });
    });

    it('detects div#test2 appended in testArea', function(done) {
      testArea.wait('on', 'div#test2', function(matches) {
        matchIsElement(matches, 'div', 'test2');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test2"></div>');
      });
    });

    it('detects div#test3 already in the testArea', function(done) {
      testArea.append('<div id="test3"></div>');
      testArea.wait('on', 'div#test3', function(matches) {
        matchIsElement(matches, 'div', 'test3');
        done();
      });
    });

    it('detects multiple divs added in the testArea', function(done) {
      var counter = 0;
      testArea.wait('on', 'div', function(matches) {
        assert.lengthOf(matches, 3);
        done();
      });
      shortDelay(function() {
        testArea.append('<div></div><div></div><div></div>');
      });
    });

    it('detects nested div that is added', function(done) {
      var counter = 0;
      testArea.wait('on', 'div.hello', function(matches) {
        matchIsElement(matches, 'div', 'topoftest');
        done();
      });

      shortDelay(function() {
        testArea.append('<div id="topoftest"><div><div class="hello" id="sometest">&nbsp;</div></div></div>');
      });
    });

    it('detects div added with innerHTML', function(done) {
      testArea.wait('on', 'div', function(matches) {
        matchIsElement(matches, 'div', 'test5');
        done();
      });
      shortDelay(function() {
        var rawTestAreaEl = testArea[0];
        rawTestAreaEl.innerHTML = '<div id="test5"></div>';
      });
    });

    it('detects nested div that is added with innerHTML', function(done) {
      var counter = 0;
      testArea.wait('on', 'div.hello', function(matches) {
        matchIsElement(matches, 'div', 'topoftest');
        done();
      });

      shortDelay(function() {
        var rawTestAreaEl = testArea[0];
        rawTestAreaEl.innerHTML = '<div id="topoftest"><div><div class="hello" id="sometest">&nbsp;</div></div></div>';
      });
    });

    it('detects continuously', function(done) {
      var counter = 5
      testArea.wait('on', 'div', { continuous: true }, function(matches) {
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

    it('does no selector filtering', function(done) {
      testArea.wait('on', null, function(added, removed) {
        matchIsElement(added, 'span', 'hello1');
        done();
      });
      shortDelay(function() {
        testArea.append('<span id="hello1"></span>');
      });
    });
  });

  describe('wait for removal', function() {
    // THIS CANNOT BE RUN IF THE BROWSER DOES NOT ALLOW NATIVE
    if(!waiter.isNative) {
      return;
    }
    it('detects a div being removed', function(done) {
      var toRemove = $('<span id="test7"></span>');
      toRemove.appendTo(testArea);
      testArea.wait('on', 'span', { includeRemoved: true }, function(added, removed) {
        matchIsElement(removed, 'span', 'test7');
        done();
      });
      mediumDelay(function() {
        toRemove.remove();
      });
    });
    
  });

  describe("wait('off', ...)", function() {
    var waitCalls = 0;
    beforeEach(function() {
      waitCalls = 0;
    });
    
    function callback() {
      waitCalls += 1;
    };

    function simpleWaiter(selector) {
      selector = selector || 'div';
      testArea.wait('on', selector, callback);
    }

    it('turns off a wait that never runs', function() {
      simpleWaiter('div');
      testArea.wait('off', 'div', callback);
      assert.equal(waitCalls, 0);
    });

    it('attempts to turn off a wait after it is called', function(done) {
      simpleWaiter('div');
      shortDelay(function() {
        testArea.append('<div></div>');
        shortDelay(function() {
          testArea.wait('off', 'div', callback);
          assert.equal(waitCalls, 1);
          done();
        });
      });
    });
    
    it('turns off a continuous wait', function(done) {
      testArea.wait('on', 'span', { continuous: true }, callback);
      
      var counter = 0;

      var finish = function() {
        testArea.wait('off', 'span', callback);
        assert.equal(waitCalls, 5);
        testArea.append('<span></span>');
        shortDelay(function() {
          assert.equal(waitCalls, 5);
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

    it('turns off all waits', function(done) {
      var waitCalls2 = 0;

      var callback2 = function() {
        waitCalls2 = 0;
      };

      testArea.wait('on', 'div', callback);
      testArea.wait('on', 'div', callback2);

      testArea.wait('off', 'div');

      shortDelay(function () {
        testArea.append('<div></div>');
        shortDelay(function() {
          assert.equal(waitCalls, 0);
          assert.equal(waitCalls2, 0);
          done();
        });
      });
    });

  });

  describe("wait('async', ...)", function() {
    it('waits asynchronously', function(done) {
      testArea.wait('async', 'div')
        .then(
          function success(matches) {
            matchIsElement(matches, 'div', 'test-async');
            done();
          },
          function error(err) {
            done(error);
          }
        )
        .done(done);
      shortDelay(function() {
        testArea.append('<div id="test-async"></div>');
      });
    });

    it('tries to wait continuously but throws an error', function() {
      assert.throws(function() {
        testArea.wait('async', 'div', { continuous: true })
      }, /Cannot .*/);
    });
  });
});
