var assert = chai.assert;


describe('jquery.match - high level', function() {
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

  describe("match('on', ...)", function() {
    it('detects a new div in testArea', function(done) {
      testArea.waitForMatch('div', function(matches) {
        matchIsElement(matches, 'div', 'test1');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test1"></div>');
      });
    });

    it('detects div#test2 appended in testArea', function(done) {
      testArea.waitForMatch('div#test2', function(matches) {
        matchIsElement(matches, 'div', 'test2');
        done();
      });
      shortDelay(function() {
        testArea.append('<div id="test2"></div>');
      });
    });

    it('detects div#test3 already in the testArea', function(done) {
      testArea.append('<div id="test3"></div>');
      testArea.waitForMatch('div#test3', function(matches) {
        matchIsElement(matches, 'div', 'test3');
        done();
      });
    });

    it('detects multiple divs added in the testArea', function(done) {
      testArea.waitForMatch('div', function(matches) {
        assert.lengthOf(matches, 3);
        done();
      });
      shortDelay(function() {
        testArea.append('<div><div></div><div></div></div>');
      });
    });

    it('detects div added with innerHTML', function(done) {
      testArea.waitForMatch('div', function(matches) {
        matchIsElement(matches, 'div', 'test5');
        done();
      });
      shortDelay(function() {
        var rawTestAreaEl = testArea[0];
        rawTestAreaEl.innerHTML = '<div id="test5"></div>';
      });
    });
  });
});
